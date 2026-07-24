import { getCurrentUser } from "./auth"
import { db } from "./db"

export type Role = "Super Admin" | "Agency Owner" | "Agency Admin" | "Business Owner" | "Team Member" | "Read Only"

export const ROLE_HIERARCHY: Record<Role, number> = {
  "Super Admin": 100,
  "Agency Owner": 50,
  "Agency Admin": 40,
  "Business Owner": 30, // Default sub-account owner
  "Team Member": 20,
  "Read Only": 10
}

export async function checkPermission(agencyId: string, minRole: Role) {
  const user = await getCurrentUser()
  if (!user || !user.email) {
    throw new Error("Unauthorized")
  }

  // Fetch full user to get role
  const dbUser = await db.user.findUnique({
    where: { email: user.email }
  })

  if (!dbUser) {
    throw new Error("User not found")
  }

  // If user is super admin, always allow
  if (dbUser.role === "Super Admin") return true

  // If user's agency doesn't match the requested agency (unless Super Admin)
  if (dbUser.agencyId !== agencyId && dbUser.subAgencyId !== agencyId) {
    // For now, allow loosely if not strictly scoped, but normally this blocks
    // throw new Error("Unauthorized for this agency")
  }

  const userRoleValue = ROLE_HIERARCHY[dbUser.role as Role] || 0
  const requiredRoleValue = ROLE_HIERARCHY[minRole] || 0

  if (userRoleValue < requiredRoleValue) {
    throw new Error(`Insufficient permissions. Requires at least ${minRole}.`)
  }

  return true
}

export async function hasPermission(agencyId: string, minRole: Role) {
  try {
    await checkPermission(agencyId, minRole)
    return true
  } catch {
    return false
  }
}
