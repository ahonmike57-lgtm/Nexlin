import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export type PlatformRole = "owner" | "developer" | "support"
export type TenantRole = "admin" | "user"

export interface AuthContext {
  userId: string
  email: string
  role: string
  isPlatformAdmin: boolean
  isImpersonating?: boolean
  agencyId?: string | null
}

/**
 * Server-side authorization check for Platform Admins.
 * 
 * Enforcement Rules:
 * 1. Must be authenticated as a Platform Admin.
 * 2. Impersonated sessions CANNOT perform platform-admin actions (no privilege escalation / nested impersonation).
 * 3. Performs a fresh database lookup against `db.platformAdmin` to verify the account is active and holds the allowed role.
 * 4. Fails with generic 403 error on unauthorized requests.
 */
export async function requirePlatformAuth(allowedRoles?: PlatformRole[]) {
  const session = await getSession()
  
  if (!session || !session.user || !(session.user as any).isPlatformAdmin) {
    return { authorized: false as const, error: "Forbidden", status: 403 }
  }

  const user = session.user as any

  // Rule: Sessions created via impersonation CANNOT execute platform admin actions
  if (user.isImpersonating) {
    return { authorized: false as const, error: "Forbidden", status: 403 }
  }

  // Fresh real-time DB check: re-verify status and role directly from PostgreSQL
  const admin = await db.platformAdmin.findUnique({
    where: { id: user.id }
  })

  if (!admin || admin.status !== "active") {
    return { authorized: false as const, error: "Forbidden", status: 403 }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(admin.role as PlatformRole)) {
      return { authorized: false as const, error: "Forbidden", status: 403 }
    }
  }

  return { 
    authorized: true as const, 
    admin, 
    session,
    role: admin.role as PlatformRole
  }
}

/**
 * Server-side authorization check for Tenant Users (Agency Level).
 * 
 * Enforcement Rules:
 * 1. Resolves `agencyId` strictly from the authenticated session (or active impersonation token). Never trusts client-supplied tenantId.
 * 2. Prevents IDOR (Insecure Direct Object Reference) by ensuring queries are locked to session.agencyId.
 * 3. Enforces tenant role requirements ('admin' vs 'user').
 */
export async function requireTenantAuth(requiredRole: TenantRole = "user") {
  const session = await getSession()

  if (!session || !session.user) {
    return { authorized: false as const, error: "Forbidden", status: 403 }
  }

  const user = session.user as any
  const agencyId = user.agencyId as string | undefined

  if (!agencyId) {
    return { authorized: false as const, error: "Forbidden", status: 403 }
  }

  // Evaluate tenant role level
  // Roles: "Agency Owner", "Business Owner", "Super Admin" count as Tenant Admin
  // "Team Member" / "User" count as Tenant User
  const roleString = (user.role || "").toLowerCase()
  const isTenantAdmin = 
    roleString.includes("owner") || 
    roleString.includes("admin") || 
    user.isPlatformAdmin // Platform admins operating within tenant scope

  if (requiredRole === "admin" && !isTenantAdmin) {
    return { authorized: false as const, error: "Forbidden", status: 403 }
  }

  return {
    authorized: true as const,
    agencyId,
    userId: user.id as string,
    userRole: user.role as string,
    isTenantAdmin,
    isImpersonating: !!user.isImpersonating,
    session
  }
}

/**
 * Backward-compatible helper for legacy server actions checking tenant permission.
 */
export async function checkPermission(agencyId?: string, roleRequired?: string): Promise<boolean> {
  const reqRole = roleRequired && roleRequired.toLowerCase().includes("admin") ? "admin" : "user"
  const auth = await requireTenantAuth(reqRole)
  if (!auth.authorized) return false
  if (agencyId && auth.agencyId !== agencyId) return false
  return true
}

/**
 * Log an impersonation start event to the audit trail
 */
export async function logImpersonationStart(data: {
  adminId: string
  adminEmail: string
  adminRole: string
  agencyId: string
  reason?: string
  ipAddress?: string
}) {
  try {
    const log = await db.impersonationLog.create({
      data: {
        adminId: data.adminId,
        adminEmail: data.adminEmail,
        adminRole: data.adminRole,
        agencyId: data.agencyId,
        reason: data.reason || "Support impersonation session",
        ipAddress: data.ipAddress || null,
        startedAt: new Date()
      }
    })
    return log
  } catch (error) {
    console.error("Failed to log impersonation start:", error)
    return null
  }
}

/**
 * Log an impersonation end event to the audit trail
 */
export async function logImpersonationEnd(logId: string) {
  try {
    await db.impersonationLog.update({
      where: { id: logId },
      data: { endedAt: new Date() }
    })
  } catch (error) {
    console.error("Failed to log impersonation end:", error)
  }
}
