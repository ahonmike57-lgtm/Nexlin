"use server"

import crypto from "crypto"
import { db } from "@/lib/db"
import { requirePlatformAuth } from "@/lib/permissions"
import { checkRateLimit } from "@/lib/rate-limit"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

function timingSafeCodeMatch(provided: string, expected: string | null | undefined): boolean {
  if (!provided || !expected) return false
  const a = crypto.createHash("sha256").update(provided).digest()
  const b = crypto.createHash("sha256").update(expected).digest()
  return crypto.timingSafeEqual(a, b)
}

export async function invitePlatformAdmin(data: {
  name: string
  email: string
  role: string
}) {
  try {
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    const email = data.email.trim().toLowerCase()
    if (!email) {
      return { success: false, error: "Email address is required." }
    }

    // Check if an active admin already exists with this email
    const existingAdmin = await db.platformAdmin.findUnique({
      where: { email }
    })

    if (existingAdmin && existingAdmin.status === "active") {
      return { success: false, error: "An active platform administrator with this email already exists." }
    }

    // Generate cryptographically random 6-digit verification code OTP
    const inviteCode = crypto.randomInt(100000, 1000000).toString()
    const codeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    let admin
    if (existingAdmin) {
      // Re-invite pending admin
      admin = await db.platformAdmin.update({
        where: { id: existingAdmin.id },
        data: {
          name: data.name.trim() || existingAdmin.name,
          role: data.role || existingAdmin.role,
          status: "pending",
          inviteCode,
          codeExpiresAt,
        }
      })
    } else {
      // Create new pending admin
      admin = await db.platformAdmin.create({
        data: {
          name: data.name.trim() || null,
          email,
          role: data.role || "developer",
          status: "pending",
          inviteCode,
          codeExpiresAt,
        }
      })
    }

    revalidatePath("/platform/admins")

    return { 
      success: true, 
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        inviteCode,
        acceptUrl: `/accept-invite?email=${encodeURIComponent(email)}&code=${inviteCode}`
      }
    }
  } catch (error: any) {
    console.error("Invite platform admin error:", error)
    return { success: false, error: error.message || "Failed to invite platform admin." }
  }
}

async function verifyAdminInviteInternal(emailInput: string, codeInput: string) {
  const email = emailInput.trim().toLowerCase()
  const code = codeInput.trim()

  if (!email || !code) {
    return { success: false as const, error: "Email and verification code are required." }
  }

  const rateLimit = checkRateLimit(`admin-invite-verify:${email}`, {
    maxRequests: 5,
    windowSeconds: 900,
  })
  if (!rateLimit.allowed) {
    return {
      success: false as const,
      error: "Too many verification attempts. Please wait 15 minutes and try again.",
    }
  }

  const admin = await db.platformAdmin.findUnique({
    where: { email },
  })

  if (!admin) {
    return { success: false as const, error: "Invalid email or verification code." }
  }

  if (admin.status === "active") {
    return {
      success: false as const,
      error: "This admin account is already active. Please log in directly.",
    }
  }

  if (!timingSafeCodeMatch(code, admin.inviteCode)) {
    return { success: false as const, error: "Invalid 6-digit verification code." }
  }

  if (admin.codeExpiresAt && new Date() > admin.codeExpiresAt) {
    return {
      success: false as const,
      error: "Verification code has expired. Please request a new invitation.",
    }
  }

  return {
    success: true as const,
    data: {
      email: admin.email,
      name: admin.name || "",
      role: admin.role,
    },
  }
}

export async function verifyAdminInviteCode(data: {
  email: string
  code: string
}) {
  try {
    return await verifyAdminInviteInternal(data.email, data.code)
  } catch (error: any) {
    console.error("Verify admin invite code error:", error)
    return { success: false as const, error: error.message || "Failed to verify invitation code." }
  }
}

export async function completeAdminSignup(data: {
  email: string
  code: string
  name: string
  password: string
}) {
  try {
    const email = data.email.trim().toLowerCase()
    const code = data.code.trim()
    const name = data.name.trim()
    const password = data.password

    if (!email || !code || !password) {
      return { success: false, error: "Email, verification code, and password are required." }
    }

    if (password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." }
    }

    // Verify OTP code (rate limited once per call)
    const verification = await verifyAdminInviteInternal(email, code)
    if (!verification.success) {
      return { success: false, error: verification.error }
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10)

    await db.platformAdmin.update({
      where: { email },
      data: {
        name: name || verification.data?.name || null,
        passwordHash,
        status: "active",
        inviteCode: null,
        codeExpiresAt: null,
      }
    })

    revalidatePath("/platform/admins")

    return { success: true }
  } catch (error: any) {
    console.error("Complete admin signup error:", error)
    return { success: false, error: error.message || "Failed to complete admin signup." }
  }
}

export async function deletePlatformAdmin(adminId: string) {
  try {
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    if (auth.admin.id === adminId) {
      return { success: false, error: "You cannot delete your own admin account." }
    }

    const targetAdmin = await db.platformAdmin.findUnique({
      where: { id: adminId }
    })

    if (!targetAdmin) {
      return { success: false, error: "Admin account not found." }
    }

    await db.platformAdmin.delete({
      where: { id: adminId }
    })

    revalidatePath("/platform/admins")

    return { success: true }
  } catch (error: any) {
    console.error("Delete platform admin error:", error)
    return { success: false, error: error.message || "Failed to delete platform admin." }
  }
}

export async function updatePlatformAdminRole(adminId: string, newRole: string) {
  try {
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    if (auth.admin.id === adminId && newRole !== "owner") {
      return { success: false, error: "You cannot change your own role from Owner." }
    }

    await db.platformAdmin.update({
      where: { id: adminId },
      data: { role: newRole }
    })

    revalidatePath("/platform/admins")
    return { success: true }
  } catch (error: any) {
    console.error("Update admin role error:", error)
    return { success: false, error: error.message || "Failed to update admin role." }
  }
}

export async function togglePlatformAdminStatus(adminId: string, newStatus: "active" | "suspended") {
  try {
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    if (auth.admin.id === adminId) {
      return { success: false, error: "You cannot suspend your own admin account." }
    }

    await db.platformAdmin.update({
      where: { id: adminId },
      data: { status: newStatus }
    })

    revalidatePath("/platform/admins")
    return { success: true }
  } catch (error: any) {
    console.error("Toggle admin status error:", error)
    return { success: false, error: error.message || "Failed to toggle admin status." }
  }
}

