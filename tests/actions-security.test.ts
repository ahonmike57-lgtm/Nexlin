import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { dbMock, requireTenantAuthMock, deliverMessageMock, cookieStoreMock } = vi.hoisted(() => ({
  dbMock: {
    adCampaign: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    affiliate: {
      create: vi.fn(),
    },
    affiliateLink: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    commissionPayout: {
      create: vi.fn(),
    },
    billingWallet: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    contact: {
      findFirst: vi.fn(),
    },
    snapshot: {
      findFirst: vi.fn(),
    },
    phoneNumber: {
      create: vi.fn(),
    },
    campaign: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    subAgency: {
      findFirst: vi.fn(),
    },
  },
  requireTenantAuthMock: vi.fn(),
  deliverMessageMock: vi.fn(),
  cookieStoreMock: {
    set: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
}))

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStoreMock),
}))
vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/permissions", () => ({ requireTenantAuth: requireTenantAuthMock }))
vi.mock("@/lib/messaging", () => ({
  deliverMessage: deliverMessageMock,
  loadChannelCredentials: vi.fn(async () => ({})),
}))
vi.mock("@/lib/pusher", () => ({ pusherServer: { trigger: vi.fn(async () => {}) } }))

import { getAdCampaigns, updateAdCampaign } from "@/app/actions/ads"
import { createAffiliate, trackAffiliateConversion } from "@/app/actions/affiliates"
import { checkAndAutoTopUpWallet } from "@/app/actions/wallet-autotopup"
import { buyPhoneNumber, sendSMS } from "@/app/actions/telephony"
import { sendCampaign } from "@/app/actions/marketing"
import { setActiveSubAccount } from "@/app/actions/subaccounts"

describe("hardened server actions", () => {
  const origEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...origEnv }
    requireTenantAuthMock.mockResolvedValue({
      authorized: true,
      agencyId: "agency_session",
      userId: "user_1",
      userRole: "Agency Owner",
      isTenantAdmin: true,
      isImpersonating: false,
    })
  })

  afterEach(() => {
    process.env = origEnv
  })

  it("ignores spoofed agencyId in ads and blocks cross-tenant updates", async () => {
    dbMock.adCampaign.findMany.mockResolvedValueOnce([])
    await getAdCampaigns("victim_agency")

    expect(dbMock.adCampaign.findMany).toHaveBeenCalledWith({
      where: { agencyId: "agency_session" },
      orderBy: { createdAt: "desc" },
    })

    dbMock.adCampaign.findFirst.mockResolvedValueOnce(null)
    const updateRes = await updateAdCampaign("camp_other_tenant", { name: "Hacked" })
    expect(updateRes).toEqual({ success: false, error: "Campaign not found" })
    expect(dbMock.adCampaign.update).not.toHaveBeenCalled()
  })

  it("validates affiliate URLs and blocks cross-tenant conversion recording", async () => {
    const badUrl = await createAffiliate("spoofed", "Alice", "alice@example.com", "javascript:alert(1)")
    expect(badUrl.success).toBe(false)
    expect(badUrl.error).toContain("http:// or https://")
    expect(dbMock.affiliate.create).not.toHaveBeenCalled()

    dbMock.affiliateLink.findUnique.mockResolvedValueOnce({
      id: "link_1",
      affiliateId: "aff_1",
      affiliate: { id: "aff_1", agencyId: "other_agency" },
    })
    const conv = await trackAffiliateConversion("ref123", 100)
    expect(conv).toEqual({ success: false, error: "Affiliate link not found" })
    expect(dbMock.commissionPayout.create).not.toHaveBeenCalled()
  })

  it("refuses unverified wallet auto-top-up balance credits", async () => {
    dbMock.billingWallet.findUnique.mockResolvedValueOnce({ id: "w_1", balance: 2 })
    const res = await checkAndAutoTopUpWallet(10, 5000)

    expect(res.success).toBe(false)
    expect((res as any).requiresPaymentMethod).toBe(true)
    expect(dbMock.billingWallet.update).not.toHaveBeenCalled()
  })

  it("blocks DND/cross-tenant SMS and fails honestly when Twilio creds are missing", async () => {
    dbMock.contact.findFirst.mockResolvedValueOnce({
      id: "c_1",
      agencyId: "agency_session",
      phone: "+15550001111",
      dndEnabled: true,
    })

    const dndRes = await sendSMS("c_1", "Hi")
    expect(dndRes.success).toBe(false)
    expect(dndRes.error).toContain("DND")
    expect(deliverMessageMock).not.toHaveBeenCalled()

    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN
    dbMock.snapshot.findFirst.mockResolvedValueOnce(null)

    const phoneRes = await buyPhoneNumber("415")
    expect(phoneRes.success).toBe(false)
    expect(dbMock.phoneNumber.create).not.toHaveBeenCalled()
  })

  it("refuses mock email campaign completion when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY
    dbMock.campaign.findFirst.mockResolvedValueOnce({
      id: "camp_1",
      agencyId: "agency_session",
      subject: "Hello",
      content: "<p>Hi</p>",
      agency: { id: "agency_session", name: "Agency" },
    })

    const res = await sendCampaign("camp_1")
    expect(res.success).toBe(false)
    expect((res as any).mock).toBeUndefined()
    expect(dbMock.campaign.update).not.toHaveBeenCalled()
  })

  it("enforces sub-account ownership and sets httpOnly cookie on switch", async () => {
    dbMock.subAgency.findFirst.mockResolvedValueOnce(null)
    const denied = await setActiveSubAccount("sub_foreign")
    expect(denied).toEqual({ success: false, error: "Sub-account not found" })
    expect(cookieStoreMock.set).not.toHaveBeenCalled()

    dbMock.subAgency.findFirst.mockResolvedValueOnce({ id: "sub_owned" })
    const allowed = await setActiveSubAccount("sub_owned")
    expect(allowed).toEqual({ success: true })
    expect(cookieStoreMock.set).toHaveBeenCalledWith(
      "activeSubAccountId",
      "sub_owned",
      expect.objectContaining({ httpOnly: true, path: "/", sameSite: "lax" })
    )
  })
})
