import crypto from "crypto"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { checkRateLimitAsync } from "@/lib/rate-limit"

const BCRYPT_ROUNDS = 12
const MIN_PASSWORD_LENGTH = 8

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"

    const ipLimit = await checkRateLimitAsync(`reset-pw-ip:${ip}`, {
      maxRequests: 10,
      windowSeconds: 900,
    })
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 15 minutes before trying again." },
        { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
      )
    }

    const { token, password } = await req.json()
    const cleanToken = typeof token === "string" ? token.trim() : ""

    if (!cleanToken || typeof password !== "string" || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      )
    }

    const tokenHash = crypto.createHash("sha256").update(cleanToken).digest("hex")

    const verificationToken = await db.verificationToken.findFirst({
      where: {
        OR: [{ token: tokenHash }, { token: cleanToken }],
      },
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    if (new Date() > verificationToken.expires) {
      await db.verificationToken.deleteMany({
        where: { identifier: verificationToken.identifier },
      })
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    await db.user.update({
      where: { email: verificationToken.identifier },
      data: { passwordHash },
    })

    await db.verificationToken.deleteMany({
      where: { identifier: verificationToken.identifier },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
