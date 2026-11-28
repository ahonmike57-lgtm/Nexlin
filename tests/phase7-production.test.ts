import crypto from "crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const {
  dbMock,
  requireTenantAuthMock,
  getActiveSubAccountIdMock,
  resendSendMock,
} = vi.hoisted(() => ({
  dbMock: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    agency: {
      findUnique: vi.fn(),
    },
    funnel: {
      findFirst: vi.fn(),
    },
  },
  requireTenantAuthMock: vi.fn(),
  getActiveSubAccountIdMock: vi.fn(),
  resendSendMock: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/permissions", () => ({ requireTenantAuth: requireTenantAuthMock }))
vi.mock("@/app/actions/subaccounts", () => ({
  getActiveSubAccountId: getActiveSubAccountIdMock,
}))
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: resendSendMock,
    }
  },
}))
vi.mock("next-auth/middleware", () => ({
  withAuth: (fn: unknown) => fn,
}))

import {
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
} from "@/app/actions/settings"
import { GET as resolveDomainGET } from "@/app/api/domains/resolve/route"
import { isCustomDomainHost } from "@/proxy"
import { checkRateLimitAsync } from "@/lib/rate-limit"

describe("Phase 7 production readiness", () => {
  const origEnv = { ...process.env }
  const origFetch = globalThis.fetch

  beforeEach(() => {
    process.env = { ...origEnv }
    vi.clearAllMocks()

    requireTenantAuthMock.mockResolvedValue({
      authorized: true,
      agencyId: "agency_1",
      userId: "owner_1",
      userRole: "Agency Owner",
      isTenantAdmin: true,
      isImpersonating: false,
    })
    getActiveSubAccountIdMock.mockResolvedValue(null)
  })

  afterEach(() => {
    process.env = origEnv
    globalThis.fetch = origFetch
  })

  it("issues a hashed invite token and copyable setup link when inviting a team member", async () => {
    delete process.env.RESEND_API_KEY
    process.env.NEXTAUTH_URL = "https://nexlin-virid.vercel.app"

    dbMock.user.findUnique.mockResolvedValue(null)
    dbMock.user.create.mockResolvedValue({
      id: "member_2",
      name: "teammate",
      email: "teammate@example.com",
      role: "Agency Admin",
      createdAt: new Date("2026-11-28T00:00:00Z"),
    })
    dbMock.verificationToken.deleteMany.mockResolvedValue({ count: 0 })
    dbMock.verificationToken.create.mockResolvedValue({
      identifier: "teammate@example.com",
      token: "hashed",
      expires: new Date(),
    })

    const res = await inviteTeamMember("Teammate@Example.com ", "Agency Admin")

    expect(res.success).toBe(true)
    expect(res.emailSent).toBe(false)
    expect(res.inviteUrl).toMatch(
      /^https:\/\/nexlin-virid\.vercel\.app\/reset-password\?token=[a-f0-9]{48}$/
    )

    const parsed = new URL(res.inviteUrl!)
    const rawToken = parsed.searchParams.get("token")!
    const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex")

    expect(dbMock.verificationToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          identifier: "teammate@example.com",
          token: expectedHash,
        }),
      })
    )
  })

  it("blocks self-modification and Agency Owner modification, and scopes role/remove updates", async () => {
    const selfRoleRes = await updateTeamMemberRole("owner_1", "Read Only")
    expect(selfRoleRes.success).toBe(false)
    expect(selfRoleRes.error).toMatch(/own role/i)

    const selfRemoveRes = await removeTeamMember("owner_1")
    expect(selfRemoveRes.success).toBe(false)
    expect(selfRemoveRes.error).toMatch(/yourself/i)

    dbMock.user.findFirst.mockResolvedValueOnce({ id: "owner_2", role: "Agency Owner" })
    const ownerEditRes = await updateTeamMemberRole("owner_2", "Team Member")
    expect(ownerEditRes.success).toBe(false)
    expect(ownerEditRes.error).toMatch(/Agency Owner/i)

    dbMock.user.findFirst.mockResolvedValueOnce({ id: "member_2", role: "Team Member" })
    dbMock.user.updateMany.mockResolvedValueOnce({ count: 1 })
    const okRoleRes = await updateTeamMemberRole("member_2", "Sales Rep")
    expect(okRoleRes.success).toBe(true)
    expect(dbMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: "member_2", agencyId: "agency_1" },
      data: { role: "Sales Rep" },
    })

    dbMock.user.findFirst.mockResolvedValueOnce({
      id: "member_2",
      email: "teammate@example.com",
      role: "Sales Rep",
    })
    dbMock.verificationToken.deleteMany.mockResolvedValueOnce({ count: 1 })
    dbMock.user.deleteMany.mockResolvedValueOnce({ count: 1 })
    const okRemoveRes = await removeTeamMember("member_2")
    expect(okRemoveRes.success).toBe(true)
    expect(dbMock.user.deleteMany).toHaveBeenCalledWith({
      where: { id: "member_2", agencyId: "agency_1" },
    })
  })

  it("maps team members to active/pending status without exposing passwordHash", async () => {
    dbMock.user.findMany.mockResolvedValue([
      {
        id: "u1",
        name: "Owner",
        email: "owner@example.com",
        role: "Agency Owner",
        createdAt: new Date("2026-11-28T00:00:00Z"),
        passwordHash: "$2b$12$hashed",
      },
      {
        id: "u2",
        name: "Invitee",
        email: "invitee@example.com",
        role: "Team Member",
        createdAt: new Date("2026-11-28T00:00:00Z"),
        passwordHash: null,
      },
    ])

    const res = await getTeamMembers()
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(2)
    expect(res.data?.[0]).not.toHaveProperty("passwordHash")
    expect(res.data?.[0]?.status).toBe("active")
    expect(res.data?.[1]?.status).toBe("pending")
  })

  it("resolves published custom domains to funnel subdomains and detects custom hosts", async () => {
    expect(isCustomDomainHost("localhost:3000", "nexlin-virid.vercel.app")).toBeNull()
    expect(isCustomDomainHost("nexlin-virid.vercel.app", "nexlin-virid.vercel.app")).toBeNull()
    expect(isCustomDomainHost("myclient.com:443", "nexlin-virid.vercel.app")).toBe("myclient.com")

    const badReq = new Request("https://nexlin-virid.vercel.app/api/domains/resolve?host=badhost")
    const badRes = await resolveDomainGET(badReq)
    expect(badRes.status).toBe(400)

    dbMock.funnel.findFirst.mockResolvedValueOnce({ subdomain: "acme-solar" })
    const okReq = new Request(
      "https://nexlin-virid.vercel.app/api/domains/resolve?host=AcmeSolar.com:443"
    )
    const okRes = await resolveDomainGET(okReq)
    expect(okRes.status).toBe(200)
    await expect(okRes.json()).resolves.toEqual({ subdomain: "acme-solar" })
  })

  it("uses Upstash REST distributed rate limiting when configured and falls back gracefully", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const mem1 = await checkRateLimitAsync("phase7-mem-key", { maxRequests: 1, windowSeconds: 60 })
    const mem2 = await checkRateLimitAsync("phase7-mem-key", { maxRequests: 1, windowSeconds: 60 })
    expect(mem1.allowed).toBe(true)
    expect(mem2.allowed).toBe(false)

    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "token_123"

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ result: 1 }, { result: 1 }]), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ result: 3 }, { result: 1 }]), { status: 200 })
      )
    globalThis.fetch = fetchMock as typeof fetch

    const up1 = await checkRateLimitAsync("phase7-upstash-key", { maxRequests: 2, windowSeconds: 60 })
    const up2 = await checkRateLimitAsync("phase7-upstash-key", { maxRequests: 2, windowSeconds: 60 })
    expect(up1.allowed).toBe(true)
    expect(up1.remaining).toBe(1)
    expect(up2.allowed).toBe(false)
    expect(up2.remaining).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // Fallback if Upstash network request fails
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error("network down")) as typeof fetch
    const fallbackRes = await checkRateLimitAsync("phase7-upstash-fallback", {
      maxRequests: 5,
      windowSeconds: 60,
    })
    expect(fallbackRes.allowed).toBe(true)
  })

  it("treats Pusher as a safe no-op when environment variables are unset", async () => {
    delete process.env.PUSHER_APP_ID
    delete process.env.PUSHER_KEY
    delete process.env.PUSHER_SECRET
    delete process.env.NEXT_PUBLIC_PUSHER_KEY

    vi.resetModules()
    const pusherMod = await import("@/lib/pusher")
    expect(pusherMod.isPusherConfigured).toBe(false)
    await expect(
      pusherMod.pusherServer.trigger("agency-1", "test-event", { ok: true })
    ).resolves.toBeUndefined()
    expect(pusherMod.getPusherClient()).toBeNull()
  })
})
