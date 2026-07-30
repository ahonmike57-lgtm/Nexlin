"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

const BCRYPT_ROUNDS = 12
const MIN_PASSWORD_LENGTH = 8

export async function registerUser(data: {
  firstName: string,
  lastName: string,
  company: string,
  email: string,
  password: string
}) {
  try {
    const email = data.email?.trim().toLowerCase()

    if (!email || !data.password) {
      return { success: false, error: "Email and password are required" }
    }

    if (data.password.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      }
    }

    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { success: false, error: "User already exists" }
    }

    const name = `${data.firstName} ${data.lastName}`.trim()

    // Hash on the server. The client must never be trusted to send a hash —
    // if it did, the hash itself would become the password.
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS)

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "Agency Owner",
      }
    })

    return { success: true, data: { id: user.id } }
  } catch (error: any) {
    console.error("Registration error:", error)
    // Don't leak internal error text (Prisma errors can echo schema/connection details).
    return { success: false, error: "Failed to register" }
  }
}
