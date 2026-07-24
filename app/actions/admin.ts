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
      return { success: false, error: "Email is required." }
    }

    // Check if admin already exists
    const existingAdmin = await db.platformAdmin.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      return { success: false, error: "A platform administrator with this email already exists." }
    }

    // Default initial temporary password
    const defaultPassword = "AdminPassword123!"
    const passwordHash = await bcrypt.hash(defaultPassword, 10)

    const newAdmin = await db.platformAdmin.create({
      data: {
        name: data.name.trim() || null,
        email,
        role: data.role || "developer",
        passwordHash,
      }
    })

    revalidatePath("/platform/admins")

    return { 
      success: true, 
      data: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        defaultPassword
      }
    }
  } catch (error: any) {
    console.error("Invite platform admin error:", error)
    return { success: false, error: error.message || "Failed to invite platform admin." }
  }
}
