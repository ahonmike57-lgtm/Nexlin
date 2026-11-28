import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { dbMock, scopedDbMock, requireTenantAuthMock, deliverMessageMock } = vi.hoisted(() => {
  const scoped = {
    conversation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(() => {
        throw new Error('tenantDb: "update" on Conversation cannot be tenant-scoped safely.')
      }),
      updateMany: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    contact: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    deal: {
      updateMany: vi.fn(),
    },
    snapshot: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  }

  return {
    scopedDbMock: scoped,
    dbMock: {
      $extends: vi.fn(() => scoped),
      rebillingMarkup: { findUnique: vi.fn() },
      billingWallet: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
      usageLog: { create: vi.fn() },
      snapshot: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
      phoneNumber: { findFirst: vi.fn() },
      funnelStep: { findFirst: vi.fn(), update: vi.fn() },
      conversation: { findFirst: vi.fn(), update: vi.fn() },
      message: { create: vi.fn() },
      mcpConnection: { findFirst: vi.fn() },
      webhookDelivery: { findFirst: vi.fn(), create: vi.fn() },
    },
    requireTenantAuthMock: vi.fn(),
    deliverMessageMock: vi.fn(),
  }
})

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => null) }))
vi.mock("@/lib/permissions", () => ({ requireTenantAuth: requireTenantAuthMock }))
vi.mock("@/lib/pusher", () => ({ pusherServer: { trigger: vi.fn(async () => {}) } }))
vi.mock("@/lib/messaging", () => ({
  deliverMessage: deliverMessageMock,
  broadcastNewMessage: vi.fn(),
  verifyWhatsappCredentials: vi.fn(async () => ({ ok: true })),
}))
vi.mock("@/app/actions/subaccounts", () => ({
  getActiveSubAccountId: vi.fn(async () => null),
}))
vi.mock("@/lib/workflow-engine", () => ({
  triggerDealStageChangedWorkflowInternal: vi.fn(async () => {}),
  triggerWorkflowsInternal: vi.fn(async () => {}),
  triggerFormSubmissionWorkflowInternal: vi.fn(async () => {}),
}))

import { encryptConfig } from "@/lib/encryption"
import { deductUsage } from "@/lib/usage"
import { getChannelCredentials, saveChannelCredentials } from "@/app/actions/channel-credentials"
import { createConversation, getMessages, sendMessage } from "@/app/actions/chat"
import { updateFunnelStepContent } from "@/app/actions/funnels"
import { interruptAiChatAndTakeover } from "@/app/actions/ai-supervisor"
import { createCPQQuote, signCPQQuote } from "@/app/actions/cpq"
import { calculateContactScore } from "@/app/actions/lead-scoring"
import { listMcpTools } from "@/lib/mcp"
import { retryWebhookDelivery } from "@/app/actions/webhook-inspector"

describe("Phase 5 security & runtime crash fixes", () => {
  const origEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...origEnv,
      ENCRYPTION_KEY: "test-phase5-encryption-key-material",
    }
    requireTenantAuthMock.mockResolvedValue({
      authorized: true,
      agencyId: "agency_1",
      userId: "user_1",
      userRole: "Agency Owner",
      isTenantAdmin: true,
      isImpersonating: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = origEnv
  })

  it("rejects zero, negative, and non-finite amounts in lib/usage.ts", async () => {
    expect(await deductUsage("agency_1", null, "sms", 0)).toEqual({
      success: false,
      error: "Usage amount must be a positive number",
    })
    expect(await deductUsage("agency_1", null, "sms", -100)).toEqual({
      success: false,
      error: "Usage amount must be a positive number",
    })
    expect(await deductUsage("agency_1", null, "sms", Number.NaN)).toEqual({
      success: false,
      error: "Usage amount must be a positive number",
    })
    expect(await deductUsage("agency_1", null, "sms", Number.POSITIVE_INFINITY)).toEqual({
      success: false,
      error: "Usage amount must be a positive number",
    })
    expect(dbMock.billingWallet.update).not.toHaveBeenCalled()
  })

  it("masks WhatsApp token & SMTP password and requires admin to save channel credentials", async () => {
    const encrypted = encryptConfig(
      JSON.stringify({
        whatsappPhoneNumberId: "12345",
        whatsappWabaId: "waba_1",
        whatsappAccessToken: "EAAG_super_secret_token_9876",
        whatsappDisplayNumber: "+14155550100",
        emailAddress: "hello@agency.com",
        smtpHost: "smtp.sendgrid.net",
        smtpPort: "587",
        smtpUser: "apikey",
        smtpPassword: "SG.super_secret_smtp_password",
      })
    )
    dbMock.snapshot.findFirst.mockResolvedValueOnce({ description: encrypted })

    const res = await getChannelCredentials()
    expect(res.success).toBe(true)
    expect((res as any).data.whatsappAccessToken).toBeUndefined()
    expect((res as any).data.smtpPassword).toBeUndefined()
    expect((res as any).data.whatsappAccessTokenMasked).toBe("••••••••9876")
    expect((res as any).data.smtpPasswordMasked).toBe("••••••••")

    requireTenantAuthMock.mockResolvedValueOnce({
      authorized: false,
      error: "Forbidden",
      status: 403,
    })
    const saveDenied = await saveChannelCredentials({ emailAddress: "attacker@evil.com" })
    expect(saveDenied).toEqual({ success: false, error: "Forbidden" })
    expect(requireTenantAuthMock).toHaveBeenLastCalledWith("admin")
  })

  it("fixes sendMessage updateMany crash and enforces chat conversation/contact IDORs", async () => {
    scopedDbMock.conversation.findFirst.mockResolvedValueOnce(null)
    const msgDenied = await getMessages("foreign_conv")
    expect(msgDenied).toEqual({ success: false, error: "Conversation not found" })
    expect(scopedDbMock.message.findMany).not.toHaveBeenCalled()

    scopedDbMock.contact.findFirst.mockResolvedValueOnce(null)
    const convDenied = await createConversation("foreign_contact", "sms")
    expect(convDenied).toEqual({ success: false, error: "Contact not found" })
    expect(scopedDbMock.conversation.create).not.toHaveBeenCalled()

    scopedDbMock.conversation.findFirst.mockResolvedValueOnce({
      id: "conv_1",
      channel: "sms",
      aiAutoReply: false,
      contact: { id: "c_1", phone: "+14155550100", email: null },
    })
    deliverMessageMock.mockResolvedValueOnce({ ok: true, providerId: "SM1" })
    scopedDbMock.message.create.mockResolvedValueOnce({
      id: "m_1",
      conversationId: "conv_1",
      content: "Hello",
      isOutbound: true,
      status: "delivered",
      createdAt: new Date(),
    })
    scopedDbMock.conversation.updateMany.mockResolvedValueOnce({ count: 1 })

    const sent = await sendMessage("conv_1", "Hello", "sms", true)
    expect(sent.success).toBe(true)
    expect(scopedDbMock.conversation.updateMany).toHaveBeenCalledWith({
      where: { id: "conv_1" },
      data: expect.objectContaining({ updatedAt: expect.any(Date) }),
    })
  })

  it("blocks cross-tenant updateFunnelStepContent", async () => {
    dbMock.funnelStep.findFirst.mockResolvedValueOnce(null)
    const res = await updateFunnelStepContent("foreign_step", "<script>alert(1)</script>")
    expect(res).toEqual({ success: false, error: "Funnel step not found" })
    expect(dbMock.funnelStep.update).not.toHaveBeenCalled()
  })

  it("blocks foreign conversation takeover and disables aiAutoReply", async () => {
    dbMock.conversation.findFirst.mockResolvedValueOnce(null)
    const denied = await interruptAiChatAndTakeover("foreign_conv", "note")
    expect(denied).toEqual({ success: false, error: "Conversation not found" })
    expect(dbMock.conversation.update).not.toHaveBeenCalled()

    dbMock.conversation.findFirst.mockResolvedValueOnce({ id: "conv_1" })
    dbMock.conversation.update.mockResolvedValueOnce({ id: "conv_1", aiAutoReply: false })
    dbMock.message.create.mockResolvedValueOnce({ id: "m_sys" })

    const ok = await interruptAiChatAndTakeover("conv_1", "Taking over")
    expect(ok.success).toBe(true)
    expect(dbMock.conversation.update).toHaveBeenCalledWith({
      where: { id: "conv_1" },
      data: expect.objectContaining({ aiAutoReply: false }),
    })
  })

  it("blocks signing pending_approval CPQ quotes and rejects invalid totals", async () => {
    const badQty = await createCPQQuote({
      title: "Bad Quote",
      contactId: "c_1",
      items: [{ name: "Setup", quantity: -2, unitPrice: 100 }],
    })
    expect(badQty.success).toBe(false)

    const badDiscount = await createCPQQuote({
      title: "Over Discount",
      contactId: "c_1",
      discountPercentage: 150,
      items: [{ name: "Setup", quantity: 1, unitPrice: 100 }],
    })
    expect(badDiscount.success).toBe(false)

    scopedDbMock.snapshot.findFirst.mockResolvedValueOnce({
      id: "q_1",
      description: JSON.stringify({ status: "pending_approval", dealId: "d_1" }),
    })
    const signDenied = await signCPQQuote({
      quoteId: "q_1",
      signatureDataUrl: "data:image/png;base64,abc",
      signerName: "Buyer",
    })
    expect(signDenied).toEqual({
      success: false,
      error: "Quote requires admin approval before signing",
    })
    expect(scopedDbMock.deal.updateMany).not.toHaveBeenCalled()
  })

  it("computes lead score idempotently without compounding across repeated runs", async () => {
    const updatedAt = new Date()
    const contactPayload = {
      id: "c_1",
      leadScore: 999,
      updatedAt,
      conversations: [{ messages: [{ id: "m1" }, { id: "m2" }] }],
      deals: [{ id: "d1", stage: "won" }],
    }
    scopedDbMock.contact.findFirst.mockResolvedValue(contactPayload)
    scopedDbMock.contact.updateMany.mockResolvedValue({ count: 1 })

    const run1 = await calculateContactScore("c_1")
    const run2 = await calculateContactScore("c_1")

    expect(run1).toEqual({ success: true, data: { contactId: "c_1", newScore: 45 } })
    expect(run2).toEqual({ success: true, data: { contactId: "c_1", newScore: 45 } })
  })

  it("blocks private-IP SSRF in MCP client and decrypts AES-256-GCM credentials", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")

    dbMock.mcpConnection.findFirst.mockResolvedValueOnce({
      id: "mcp_ssrf",
      agencyId: "agency_1",
      serverUrl: "http://169.254.169.254/latest",
      encryptedCredentials: null,
    })
    await expect(listMcpTools("mcp_ssrf", "agency_1")).rejects.toThrow(
      /Unsafe outbound URL blocked/
    )
    expect(fetchSpy).not.toHaveBeenCalled()

    const encToken = encryptConfig("mcp_secret_token")
    dbMock.mcpConnection.findFirst.mockResolvedValueOnce({
      id: "mcp_ok",
      agencyId: "agency_1",
      serverUrl: "https://mcp.example.com/",
      encryptedCredentials: encToken,
    })
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ tools: [{ name: "ping", description: "ok" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )

    const tools = await listMcpTools("mcp_ok", "agency_1")
    expect(tools).toEqual([{ name: "ping", description: "ok" }])
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://mcp.example.com/tools",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer mcp_secret_token" }),
      })
    )
  })

  it("blocks SSRF URLs on webhook retry", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    dbMock.webhookDelivery.findFirst.mockResolvedValueOnce({
      id: "wd_1",
      webhookId: "wh_1",
      agencyId: "agency_1",
      url: "http://127.0.0.1:8080/internal",
      event: "lead.created",
      payload: "{}",
      retryCount: 0,
    })

    const res = await retryWebhookDelivery("wd_1")
    expect(res.success).toBe(false)
    expect(res.error).toContain("Unsafe outbound URL blocked")
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
