import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { dbMock, scopedDbMock, requireTenantAuthMock } = vi.hoisted(() => {
  const scoped = {
    form: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    formSubmission: {
      findMany: vi.fn(),
    },
  }
  return {
    scopedDbMock: scoped,
    dbMock: {
      $extends: vi.fn(() => scoped),
    },
    requireTenantAuthMock: vi.fn(),
  }
})

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => null) }))
vi.mock("@/lib/permissions", () => ({ requireTenantAuth: requireTenantAuthMock }))
vi.mock("@/lib/workflow-engine", () => ({
  triggerFormSubmissionWorkflowInternal: vi.fn(async () => {}),
}))
vi.mock("@/app/actions/ai", () => ({
  generateAiReply: vi.fn(async () => ({ success: false, error: "unused" })),
}))

import { isDeploymentSkewError } from "@/lib/chunk-recovery"
import { getForms, duplicateForm, getFormSubmissions } from "@/app/actions/forms"
import { parseSentryDsn, reportServerError } from "@/lib/monitoring"
import { POST as clientErrorPOST } from "@/app/api/monitoring/client-error/route"

describe("Phase 8 production polish & observability", () => {
  const origEnv = { ...process.env }
  const origFetch = globalThis.fetch

  beforeEach(() => {
    process.env = { ...origEnv }
    vi.clearAllMocks()
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
    process.env = origEnv
    globalThis.fetch = origFetch
  })

  it("identifies Next.js ChunkLoadError and Server Action deployment skew accurately", () => {
    expect(isDeploymentSkewError(new Error("Failed to load chunk /_next/static/chunks/abc.js"))).toBe(true)
    const actionErr = new Error('Server Action "0098c09" was not found on the server')
    actionErr.name = "UnrecognizedActionError"
    expect(isDeploymentSkewError(actionErr)).toBe(true)
    expect(isDeploymentSkewError(new Error("Validation failed: email invalid"))).toBe(false)
  })

  it("duplicates owned forms, blocks cross-tenant access, and parses form submissions safely", async () => {
    scopedDbMock.form.findMany.mockResolvedValueOnce([])
    const listRes = await getForms()
    expect(listRes.success).toBe(true)
    expect(scopedDbMock.form.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { _count: { select: { submissions: true } } },
      })
    )

    scopedDbMock.form.findFirst.mockResolvedValueOnce(null)
    const missingDup = await duplicateForm("foreign_form")
    expect(missingDup.success).toBe(false)

    scopedDbMock.form.findFirst.mockResolvedValueOnce({
      id: "form_1",
      name: "Lead Form",
      fields: '[{"label":"Email"}]',
      isActive: true,
    })
    scopedDbMock.form.create.mockResolvedValueOnce({
      id: "form_2",
      name: "Lead Form (Copy)",
      fields: '[{"label":"Email"}]',
      isActive: true,
      _count: { submissions: 0 },
    })
    const dupRes = await duplicateForm("form_1")
    expect(dupRes.success).toBe(true)
    expect(scopedDbMock.form.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agencyId: "agency_1",
          name: "Lead Form (Copy)",
        }),
      })
    )

    scopedDbMock.form.findFirst.mockResolvedValueOnce({ id: "form_1", name: "Lead Form" })
    scopedDbMock.formSubmission.findMany.mockResolvedValueOnce([
      {
        id: "sub_1",
        contactId: "c_1",
        data: '{"email":"lead@example.com","name":"Ada"}',
        createdAt: new Date("2026-11-28T00:00:00Z"),
      },
      {
        id: "sub_2",
        contactId: null,
        data: "{bad-json",
        createdAt: new Date("2026-11-27T00:00:00Z"),
      },
    ])

    const subRes = await getFormSubmissions("form_1")
    expect(subRes.success).toBe(true)
    if (subRes.success && subRes.data) {
      expect(subRes.data.submissions).toHaveLength(2)
      expect(subRes.data.submissions[0].data).toEqual({
        email: "lead@example.com",
        name: "Ada",
      })
      expect(subRes.data.submissions[1].data).toEqual({ raw: "{bad-json" })
    }
  })

  it("parses valid Sentry DSNs, rejects malformed ones, and dispatches monitoring non-throwingly", async () => {
    expect(parseSentryDsn("http://insecure@sentry.io/123")).toBeNull()
    expect(parseSentryDsn("not-a-url")).toBeNull()

    const parsed = parseSentryDsn("https://pub123@o456.ingest.sentry.io/7890")
    expect(parsed).toEqual({
      dsn: "https://pub123@o456.ingest.sentry.io/7890",
      envelopeUrl: "https://o456.ingest.sentry.io/api/7890/envelope/",
      authHeader: "Sentry sentry_version=7, sentry_client=nexlin-ghl/1.0, sentry_key=pub123",
    })

    process.env.SENTRY_DSN = "https://pub123@o456.ingest.sentry.io/7890"
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("sentry unreachable"))
    globalThis.fetch = fetchMock as typeof fetch

    await expect(
      reportServerError(new Error("DB timeout"), { path: "/api/test" })
    ).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://o456.ingest.sentry.io/api/7890/envelope/",
      expect.objectContaining({ method: "POST" })
    )
    consoleSpy.mockRestore()
  })

  it("validates client error monitoring payloads on /api/monitoring/client-error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const badReq = new Request("https://nexlin-virid.vercel.app/api/monitoring/client-error", {
      method: "POST",
      body: "{invalid",
    })
    const badRes = await clientErrorPOST(badReq)
    expect(badRes.status).toBe(400)

    const okReq = new Request("https://nexlin-virid.vercel.app/api/monitoring/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boundary: "dashboard",
        name: "ChunkLoadError",
        message: "Loading chunk failed",
        path: "/dashboard",
        isSkew: true,
      }),
    })
    const okRes = await clientErrorPOST(okReq)
    expect(okRes.status).toBe(200)
    await expect(okRes.json()).resolves.toEqual({ ok: true })
    consoleSpy.mockRestore()
  })
})
