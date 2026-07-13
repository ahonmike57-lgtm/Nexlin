"use server"

import { db } from "@/lib/db"

export async function registerUser(data: { 
  firstName: string, 
  lastName: string, 
  company: string, 
  email: string, 
  passwordHash: string 
}) {
  try {
    const existingUser = await db.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return { success: false, error: "User already exists" }
    }

    const name = `${data.firstName} ${data.lastName}`.trim()
    
    // In production we would hash the password here (e.g. bcrypt)
    // For now we assume the client sent the string to store, per Phase 3 specs.
    
    const user = await db.user.create({
      data: {
        name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: "Agency Owner",
      }
    })

    return { success: true, data: { id: user.id } }
  } catch (error: any) {
    console.error("Registration error:", error)
    return { success: false, error: error.message || "Failed to register" }
  }
}
