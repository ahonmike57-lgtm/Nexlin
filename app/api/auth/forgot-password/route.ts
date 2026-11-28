import crypto from "crypto"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { checkRateLimitAsync } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"

    const ipLimit = await checkRateLimitAsync(`forgot-pw-ip:${ip}`, {
      maxRequests: 5,
      windowSeconds: 900,
    })
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 15 minutes before trying again." },
        { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
      )
    }

    const { email } = await req.json()

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    const emailLimit = await checkRateLimitAsync(`forgot-pw-email:${cleanEmail}`, {
      maxRequests: 3,
      windowSeconds: 900,
    })
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 15 minutes before trying again." },
        { status: 429, headers: { "Retry-After": String(emailLimit.resetInSeconds) } }
      )
    }

    const resendKey = process.env.RESEND_API_KEY?.trim()
    if (!resendKey) {
      console.error("Forgot password failed: RESEND_API_KEY is not configured")
      return NextResponse.json(
        { error: "Password reset email service is not configured" },
        { status: 503 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate cryptographically secure token and store its SHA-256 hash
    const rawToken = crypto.randomUUID()
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    await db.verificationToken.deleteMany({
      where: { identifier: cleanEmail },
    })

    await db.verificationToken.create({
      data: { identifier: cleanEmail, token: tokenHash, expires },
    })

    const appUrl = (
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(req.url).origin
    ).replace(/\/$/, "")

    const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`
    const resend = new Resend(resendKey)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Nexlin <onboarding@resend.dev>",
      to: cleanEmail,
      subject: "Reset your Nexlin password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
          <p>Click the link below to securely reset your password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666;">This link will expire in 1 hour. If you did not request this, no action is required.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
