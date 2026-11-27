import { describe, expect, it, vi } from "vitest"

const { dbMock, getSessionMock } = vi.hoisted(() => ({
  dbMock: {
    $extends: vi.fn((ext: any) => ext),
    platformAdmin: {
      findUnique: vi.fn(),
    },
  },
  getSessionMock: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: dbMock,
}))

vi.mock("@/lib/auth", () => ({
  getSession: getSessionMock,
}))

import { tenantDb } from "@/lib/tenant"
import { requirePlatformAuth, requireTenantAuth } from "@/lib/permissions"

describe("tenantDb and permission guards", () => {
  it("injects agencyId and deletedAt: null on filterable soft-delete queries", async () => {
    const ext = tenantDb("agency_1") as any
    const handler = ext.query.$allModels.$allOperations
    const spyQuery = vi.fn(async (a: any) => a)

    const result = await handler({
      model: "Contact",
      operation: "findMany",
      args: { where: { email: "lead@example.com" } },
      query: spyQuery,
    })

    expect(result.where).toEqual({
      email: "lead@example.com",
      agencyId: "agency_1",
      deletedAt: null,
    })
  })

  it("forces agencyId on create and hides cross-tenant or soft-deleted unique reads", async () => {
    const ext = tenantDb("agency_1") as any
    const handler = ext.query.$allModels.$allOperations

    const created = await handler({
      model: "Deal",
      operation: "create",
      args: { data: { title: "Enterprise Plan", agencyId: "spoofed_agency" } },
      query: async (a: any) => a,
    })
    expect(created.data.agencyId).toBe("agency_1")

    const crossTenant = await handler({
      model: "Contact",
      operation: "findUnique",
      args: { where: { id: "c_2" } },
      query: async () => ({ id: "c_2", agencyId: "agency_2", deletedAt: null }),
    })
    expect(crossTenant).toBeNull()

    const trashed = await handler({
      model: "Contact",
      operation: "findUnique",
      args: { where: { id: "c_1" } },
      query: async () => ({ id: "c_1", agencyId: "agency_1", deletedAt: new Date() }),
    })
    expect(trashed).toBeNull()
  })

  it("throws on unsafe unique update/delete in tenantDb", async () => {
    const ext = tenantDb("agency_1") as any
    const handler = ext.query.$allModels.$allOperations

    await expect(
      handler({
        model: "Contact",
        operation: "update",
        args: { where: { id: "c_1" }, data: {} },
        query: vi.fn(),
      })
    ).rejects.toThrow(/cannot be tenant-scoped safely/)
  })

  it("enforces tenant roles and prevents impersonation privilege escalation", async () => {
    getSessionMock.mockResolvedValueOnce(null)
    expect(await requireTenantAuth("user")).toEqual({
      authorized: false,
      error: "Forbidden",
      status: 403,
    })

    getSessionMock.mockResolvedValueOnce({
      user: { id: "u_1", role: "Team Member", agencyId: "agency_1" },
    })
    expect(await requireTenantAuth("admin")).toEqual({
      authorized: false,
      error: "Forbidden",
      status: 403,
    })

    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "admin_1",
        role: "owner",
        isPlatformAdmin: true,
        isImpersonating: true,
        agencyId: "agency_target",
      },
    })
    const tenantAuth = await requireTenantAuth("admin")
    expect(tenantAuth.authorized).toBe(true)
    if (tenantAuth.authorized) {
      expect(tenantAuth.agencyId).toBe("agency_target")
      expect(tenantAuth.isImpersonating).toBe(true)
    }

    // Same impersonating session MUST be denied platform-admin endpoints
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "admin_1",
        role: "owner",
        isPlatformAdmin: true,
        isImpersonating: true,
        agencyId: "agency_target",
      },
    })
    expect(await requirePlatformAuth(["owner"])).toEqual({
      authorized: false,
      error: "Forbidden",
      status: 403,
    })
    expect(dbMock.platformAdmin.findUnique).not.toHaveBeenCalled()
  })
})
