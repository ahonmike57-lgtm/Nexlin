import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  rawDbMock,
  scopedDbMock,
  requireTenantAuthMock,
  triggerFormWorkflowMock,
} = vi.hoisted(() => {
  const scoped = {
    funnel: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  }
  const raw = {
    $extends: vi.fn(() => scoped),
    funnel: {
      findUnique: vi.fn(),
    },
    funnelStep: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    contact: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  }
  return {
    rawDbMock: raw,
    scopedDbMock: scoped,
    requireTenantAuthMock: vi.fn(),
    triggerFormWorkflowMock: vi.fn(async () => {}),
  }
})

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: rawDbMock }))
vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => null) }))
vi.mock("@/lib/permissions", () => ({ requireTenantAuth: requireTenantAuthMock }))
vi.mock("@/app/actions/subaccounts", () => ({
  getActiveSubAccountId: vi.fn(async () => null),
}))
vi.mock("@/lib/workflow-engine", () => ({
  triggerFormSubmissionWorkflowInternal: triggerFormWorkflowMock,
}))
vi.mock("@/app/actions/ai", () => ({
  generateAiReply: vi.fn(async () => ({ success: false, error: "Not configured" })),
}))

import {
  addFunnelStep,
  createFunnel,
  deleteFunnelStep,
  getLiveFunnelStep,
  publishVibecodeToFunnel,
  submitLiveFunnelForm,
  updateFunnelMetadata,
  updateFunnelStep,
} from "@/app/actions/funnels"

describe("Unified AI Website & Funnel Builder actions", () => {
  beforeEach(() => {
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

  it("createFunnel defaults to lowercase draft and random hex subdomain", async () => {
    scopedDbMock.funnel.create.mockImplementationOnce(async ({ data }: any) => ({
      id: "fn_1",
      ...data,
      steps: [],
    }))

    const res = await createFunnel("Growth Studio")
    expect(res.success).toBe(true)
    expect(scopedDbMock.funnel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agencyId: "agency_1",
          name: "Growth Studio",
          status: "draft",
          subdomain: expect.stringMatching(/^growth-studio-[0-9a-f]{6}$/),
        }),
      })
    )
  })

  it("updateFunnelMetadata rejects invalid status and updates valid statuses", async () => {
    scopedDbMock.funnel.findFirst.mockResolvedValueOnce({ id: "fn_1", subdomain: "demo" })
    const bad = await updateFunnelMetadata("fn_1", { status: "bogus" as any })
    expect(bad).toEqual({
      success: false,
      error: "Invalid status. Must be draft, published, or archived",
    })
    expect(scopedDbMock.funnel.updateMany).not.toHaveBeenCalled()

    scopedDbMock.funnel.findFirst
      .mockResolvedValueOnce({ id: "fn_1", subdomain: "demo" })
      .mockResolvedValueOnce({ id: "fn_1", status: "published", steps: [] })
    scopedDbMock.funnel.updateMany.mockResolvedValueOnce({ count: 1 })

    const ok = await updateFunnelMetadata("fn_1", { status: "published" })
    expect(ok.success).toBe(true)
    expect(scopedDbMock.funnel.updateMany).toHaveBeenCalledWith({
      where: { id: "fn_1" },
      data: { status: "published" },
    })
  })

  it("addFunnelStep normalizes paths & blocks duplicates; deleteFunnelStep protects last page", async () => {
    scopedDbMock.funnel.findFirst.mockResolvedValueOnce({
      id: "fn_1",
      name: "Site",
      steps: [{ id: "st_home", path: "/" }],
    })
    const dup = await addFunnelStep("fn_1", { name: "Home", path: "/" })
    expect(dup).toEqual({
      success: false,
      error: 'A page with path "/" already exists on this site',
    })
    expect(rawDbMock.funnelStep.create).not.toHaveBeenCalled()

    scopedDbMock.funnel.findFirst.mockResolvedValueOnce({
      id: "fn_1",
      name: "Site",
      steps: [{ id: "st_home", path: "/" }],
    })
    rawDbMock.funnelStep.create.mockResolvedValueOnce({
      id: "st_pricing",
      name: "Pricing",
      path: "/pricing",
    })

    const created = await addFunnelStep("fn_1", { name: "Pricing", path: "Pricing" })
    expect(created.success).toBe(true)
    expect(rawDbMock.funnelStep.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        funnelId: "fn_1",
        name: "Pricing",
        path: "/pricing",
        order: 1,
      }),
    })

    scopedDbMock.funnel.findFirst.mockResolvedValueOnce({
      id: "fn_1",
      steps: [{ id: "st_home" }],
    })
    const delLast = await deleteFunnelStep("fn_1", "st_home")
    expect(delLast).toEqual({
      success: false,
      error: "Cannot delete the only page of a site",
    })
    expect(rawDbMock.funnelStep.deleteMany).not.toHaveBeenCalled()
  })

  it("updateFunnelStep blocks foreign steps and caps saved history to 10 snapshots", async () => {
    rawDbMock.funnelStep.findFirst.mockResolvedValueOnce(null)
    const denied = await updateFunnelStep("foreign_step", { content: "<h1>X</h1>" })
    expect(denied).toEqual({ success: false, error: "Funnel step not found" })
    expect(rawDbMock.funnelStep.update).not.toHaveBeenCalled()

    const tenEntries = Array.from({ length: 10 }, (_, i) => ({
      savedAt: `2026-01-0${i + 1}T00:00:00.000Z`,
      label: `V${i}`,
      content: `<p>${i}</p>`,
    }))
    rawDbMock.funnelStep.findFirst.mockResolvedValueOnce({
      id: "st_1",
      content: "<p>Old</p>",
      config: JSON.stringify({ history: tenEntries }),
      funnel: { id: "fn_1", subdomain: "site-1" },
    })
    rawDbMock.funnelStep.update.mockImplementationOnce(async ({ data }: any) => ({
      id: "st_1",
      ...data,
    }))

    const ok = await updateFunnelStep("st_1", {
      content: "<p>New</p>",
      saveHistory: true,
      historyLabel: "Edit 11",
    })
    expect(ok.success).toBe(true)
    const savedConfig = JSON.parse((rawDbMock.funnelStep.update.mock.calls[0][0] as any).data.config)
    expect(savedConfig.history).toHaveLength(10)
    expect(savedConfig.history[9]).toEqual(
      expect.objectContaining({ label: "Edit 11", content: "<p>Old</p>" })
    )
  })

  it("getLiveFunnelStep hides draft/archived sites and exposes published sites with sibling pages", async () => {
    rawDbMock.funnel.findUnique.mockResolvedValueOnce({
      id: "fn_draft",
      status: "draft",
      steps: [{ id: "st_1", name: "Home", path: "/" }],
    })
    expect(await getLiveFunnelStep("draft-site", "home")).toEqual({
      success: false,
      error: "Not found",
    })

    rawDbMock.funnel.findUnique.mockResolvedValueOnce({
      id: "fn_arch",
      status: "archived",
      steps: [{ id: "st_1", name: "Home", path: "/" }],
    })
    expect(await getLiveFunnelStep("arch-site", "home")).toEqual({
      success: false,
      error: "Not found",
    })

    rawDbMock.funnel.findUnique.mockResolvedValueOnce({
      id: "fn_pub",
      name: "Live Studio",
      status: "published",
      steps: [
        { id: "st_1", name: "Home", path: "/" },
        { id: "st_2", name: "About", path: "/about" },
      ],
    })
    const pub = await getLiveFunnelStep("live-site", "about")
    expect(pub.success).toBe(true)
    expect(pub.data?.step.id).toBe("st_2")
    expect(pub.data?.pages).toEqual([
      { id: "st_1", name: "Home", path: "/" },
      { id: "st_2", name: "About", path: "/about" },
    ])
  })

  it("publishVibecodeToFunnel updates owned existingFunnelId and blocks foreign ones", async () => {
    scopedDbMock.funnel.findFirst.mockResolvedValueOnce(null)
    const denied = await publishVibecodeToFunnel({
      name: "Hijack",
      htmlContent: "<h1>No</h1>",
      existingFunnelId: "foreign_funnel",
    })
    expect(denied).toEqual({ success: false, error: "Site not found" })

    scopedDbMock.funnel.findFirst.mockResolvedValueOnce({
      id: "fn_owned",
      subdomain: "owned-abc",
      steps: [{ id: "st_owned" }],
    })
    rawDbMock.funnelStep.findFirst.mockResolvedValueOnce({
      id: "st_owned",
      content: "<h1>Old</h1>",
      config: "{}",
      funnel: { id: "fn_owned", subdomain: "owned-abc" },
    })
    rawDbMock.funnelStep.update.mockResolvedValueOnce({ id: "st_owned" })
    scopedDbMock.funnel.updateMany.mockResolvedValueOnce({ count: 1 })

    const updated = await publishVibecodeToFunnel({
      name: "Owned Site",
      htmlContent: "<h1>Updated</h1>",
      existingFunnelId: "fn_owned",
    })
    expect(updated).toEqual({
      success: true,
      data: {
        funnelId: "fn_owned",
        subdomain: "owned-abc",
        liveUrl: "/f/owned-abc",
      },
    })
  })

  it("submitLiveFunnelForm validates contact info, deduplicates contacts, and triggers workflows", async () => {
    rawDbMock.funnel.findUnique.mockResolvedValue({
      id: "fn_pub",
      agencyId: "agency_1",
      subAgencyId: null,
      status: "published",
    })

    const missing = await submitLiveFunnelForm("pub-site", { name: "No Contact Info" })
    expect(missing).toEqual({
      success: false,
      error: "Please provide an email address or phone number.",
    })

    rawDbMock.contact.findFirst.mockResolvedValueOnce({
      id: "c_existing",
      email: "lead@example.com",
      phone: null,
      leadScore: 20,
    })
    rawDbMock.contact.update.mockResolvedValueOnce({
      id: "c_existing",
      email: "lead@example.com",
      leadScore: 35,
    })

    const submitted = await submitLiveFunnelForm("pub-site-dedup", {
      name: "Alex Smith",
      email: "  LEAD@Example.COM ",
      phone: "+15550001111",
    })
    expect(submitted.success).toBe(true)
    expect(rawDbMock.contact.create).not.toHaveBeenCalled()
    expect(triggerFormWorkflowMock).toHaveBeenCalledWith(
      "agency_1",
      "fn_pub",
      "c_existing",
      expect.objectContaining({ email: "  LEAD@Example.COM " }),
      null
    )
  })
})
