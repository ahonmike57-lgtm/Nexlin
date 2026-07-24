"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function invitePlatformAdmin(data: {
  name: string
  email: string
  role: string
}) {
  try {
    const session = await getSession()
    if (!session || !session.user || !(session.user as any).isPlatformAdmin) {
      return { success: false, error: "Unauthorized. Platform admin access required." }
    }

    const currentRole = (session.user as any).role
    if (currentRole !== "owner") {
      return { success: false, error: "Only platform owners can invite new admins." }
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

    // Generate 6-digit verification code OTP
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString()
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
        acceptUrl: `/platform/accept-invite?email=${encodeURIComponent(email)}&code=${inviteCode}`
      }
    }
  } catch (error: any) {
    console.error("Invite platform admin error:", error)
    return { success: false, error: error.message || "Failed to invite platform admin." }
  }
}

export async function verifyAdminInviteCode(data: {
  email: string
  code: string
}) {
  try {
    const email = data.email.trim().toLowerCase()
    const code = data.code.trim()

    if (!email || !code) {
      return { success: false, error: "Email and verification code are required." }
    }

    const admin = await db.platformAdmin.findUnique({
      where: { email }
    })

    if (!admin) {
      return { success: false, error: "No admin invitation found for this email address." }
    }

    if (admin.status === "active") {
      return { success: false, error: "This admin account is already active. Please log in directly." }
    }

    if (admin.inviteCode !== code) {
      return { success: false, error: "Invalid 6-digit verification code." }
    }

    if (admin.codeExpiresAt && new Date() > admin.codeExpiresAt) {
      return { success: false, error: "Verification code has expired. Please request a new invitation." }
    }

    return { 
      success: true, 
      data: {
        email: admin.email,
        name: admin.name || "",
        role: admin.role
      } 
    }
  } catch (error: any) {
    console.error("Verify admin invite code error:", error)
    return { success: false, error: error.message || "Failed to verify invitation code." }
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

    // Verify OTP code
    const verification = await verifyAdminInviteCode({ email, code })
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
