import { beforeEach, describe, expect, it, vi } from "vitest"

const { dbMock, deliverMessageMock, logWebhookDeliveryMock, pusherMock } = vi.hoisted(() => ({
  dbMock: {
    workflow: { findFirst: vi.fn(), findMany: vi.fn() },
    contact: { findFirst: vi.fn(), updateMany: vi.fn() },
    deal: { updateMany: vi.fn() },
    user: { findFirst: vi.fn() },
    conversation: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    message: { create: vi.fn() },
    notification: { create: vi.fn() },
  },
  deliverMessageMock: vi.fn(),
  logWebhookDeliveryMock: vi.fn(async () => null),
  pusherMock: { trigger: vi.fn(async () => {}) },
}))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/inngest/client", () => ({ inngest: { send: vi.fn() } }))
vi.mock("@/lib/messaging", () => ({ deliverMessage: deliverMessageMock }))
vi.mock("@/lib/webhooks", () => ({ logWebhookDelivery: logWebhookDeliveryMock }))
vi.mock("@/lib/pusher", () => ({ pusherServer: pusherMock }))

import { runSingleWorkflowAction } from "@/lib/workflow-engine"

describe("lib/workflow-engine runSingleWorkflowAction", () => {
  const wf = { id: "wf_1", agencyId: "agency_1", name: "Lead Nurture" }
  const baseContact = {
    id: "c_1",
    firstName: "Sam",
    lastName: "Rivera",
    email: "sam@example.com",
    phone: "+15551234567",
    company: "Acme",
    leadScore: 20,
    emailSuppressed: false,
    dndEnabled: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    dbMock.conversation.findFirst.mockResolvedValue({ id: "conv_1" })
    dbMock.conversation.update.mockResolvedValue({})
    dbMock.message.create.mockResolvedValue({})
  })

  it("skips suppressed email contacts and sends real email for eligible contacts", async () => {
    const skipped = await runSingleWorkflowAction(
      wf,
      { ...baseContact, emailSuppressed: true },
      { id: "a_1", type: "send_email", config: JSON.stringify({ subject: "Hi {{contact.firstName}}", body: "Welcome" }) },
      { contact: baseContact }
    )
    expect(skipped.status).toBe("skipped")
    expect(deliverMessageMock).not.toHaveBeenCalled()

    deliverMessageMock.mockResolvedValueOnce({ ok: true, providerId: "email_1" })
    const sent = await runSingleWorkflowAction(
      wf,
      baseContact,
      { id: "a_2", type: "send_email", config: JSON.stringify({ subject: "Hi {{contact.firstName}}", body: "Welcome to {{agency.name}}" }) },
      { contact: baseContact, agency: { name: "Nexlin" } }
    )
    expect(sent.status).toBe("executed")
    expect(deliverMessageMock).toHaveBeenCalledWith({
      agencyId: "agency_1",
      channel: "email",
      contact: baseContact,
      subject: "Hi Sam",
      content: "Welcome to Nexlin",
    })
  })

  it("skips DND SMS contacts and delivers real SMS for eligible contacts", async () => {
    const skipped = await runSingleWorkflowAction(
      wf,
      { ...baseContact, dndEnabled: true },
      { id: "a_3", type: "send_sms", config: JSON.stringify({ message: "Hello" }) },
      { contact: baseContact }
    )
    expect(skipped.status).toBe("skipped")
    expect(deliverMessageMock).not.toHaveBeenCalled()

    deliverMessageMock.mockResolvedValueOnce({ ok: true, providerId: "SM123" })
    const sent = await runSingleWorkflowAction(
      wf,
      baseContact,
      { id: "a_4", type: "send_sms", config: JSON.stringify({ message: "Ping {{contact.firstName}}" }) },
      { contact: baseContact }
    )
    expect(sent.status).toBe("executed")
    expect(deliverMessageMock).toHaveBeenCalledWith({
      agencyId: "agency_1",
      channel: "sms",
      contact: baseContact,
      content: "Ping Sam",
    })
  })

  it("rejects assign_rep outside owning agency and scopes update_deal_stage", async () => {
    dbMock.user.findFirst.mockResolvedValueOnce(null)
    const denied = await runSingleWorkflowAction(
      wf,
      baseContact,
      { id: "a_5", type: "assign_rep", config: JSON.stringify({ userId: "foreign_user" }) },
      {}
    )
    expect(denied.status).toBe("failed")
    expect(dbMock.contact.updateMany).not.toHaveBeenCalled()

    await runSingleWorkflowAction(
      wf,
      baseContact,
      { id: "a_6", type: "update_deal_stage", config: JSON.stringify({ stage: "won" }) },
      {}
    )
    expect(dbMock.deal.updateMany).toHaveBeenCalledWith({
      where: { contactId: "c_1", agencyId: "agency_1" },
      data: { stage: "won" },
    })
  })

  it("blocks SSRF outbound webhook URLs before calling fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const res = await runSingleWorkflowAction(
      wf,
      baseContact,
      { id: "a_7", type: "post_webhook", config: JSON.stringify({ webhookUrl: "http://169.254.169.254/latest/meta-data/" }) },
      {}
    )

    expect(res.status).toBe("failed")
    expect(res.detail).toContain("Unsafe outbound URL blocked")
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(logWebhookDeliveryMock).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, agencyId: "agency_1" })
    )
  })
})
