import crypto from "crypto"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { encryptConfig } from "@/lib/encryption"
import { requireTenantAuth } from "@/lib/permissions"

const STATE_MAX_AGE_MS = 15 * 60 * 1000

export async function GET(request: Request) {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    new URL(request.url).origin
  ).replace(/\/$/, "")

  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return NextResponse.redirect(`${appUrl}/social?error=unauthorized`)
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${appUrl}/social?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 })
  }

  if (code.startsWith("MOCK_CODE_")) {
    return NextResponse.redirect(`${appUrl}/social?error=mock_oauth_disabled`)
  }

  const stateSecret = (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)?.trim()
  if (!stateSecret) {
    return NextResponse.redirect(`${appUrl}/social?error=oauth_misconfigured`)
  }

  try {
    const dotIndex = state.lastIndexOf(".")
    if (dotIndex <= 0) {
      return NextResponse.redirect(`${appUrl}/social?error=invalid_state`)
    }

    const payloadB64 = state.slice(0, dotIndex)
    const providedSig = state.slice(dotIndex + 1)
    if (!/^[0-9a-f]{64}$/i.test(providedSig)) {
      return NextResponse.redirect(`${appUrl}/social?error=invalid_state`)
    }

    const expectedSig = crypto
      .createHmac("sha256", stateSecret)
      .update(payloadB64)
      .digest("hex")

    if (
      !crypto.timingSafeEqual(
        Buffer.from(providedSig.toLowerCase(), "hex"),
        Buffer.from(expectedSig.toLowerCase(), "hex")
      )
    ) {
      return NextResponse.redirect(`${appUrl}/social?error=invalid_state`)
    }

    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"))
    const { agencyId, platform, ts } = parsed || {}

    if (
      typeof agencyId !== "string" ||
      typeof platform !== "string" ||
      typeof ts !== "number" ||
      Date.now() - ts > STATE_MAX_AGE_MS ||
      Date.now() - ts < -60_000 ||
      agencyId !== auth.agencyId
    ) {
      return NextResponse.redirect(`${appUrl}/social?error=invalid_state`)
    }

    const redirectUri = `${appUrl}/api/oauth/callback`
    let accessToken = ""
    let handle = ""

    try {
      const cleanPlatform = platform.toLowerCase()
      if (cleanPlatform === "facebook" || cleanPlatform === "instagram") {
        const tokenRes = await fetch(
          `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(process.env.FACEBOOK_CLIENT_ID || "")}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(process.env.FACEBOOK_CLIENT_SECRET || "")}&code=${encodeURIComponent(code)}`,
          { signal: AbortSignal.timeout(15000) }
        )
        const data = await tokenRes.json().catch(() => ({}))
        if (tokenRes.ok && data.access_token) {
          accessToken = data.access_token
          const userRes = await fetch(
            `https://graph.facebook.com/me?fields=name,id&access_token=${encodeURIComponent(accessToken)}`,
            { signal: AbortSignal.timeout(10000) }
          )
          const userData = await userRes.json().catch(() => ({}))
          handle = userData.name
            ? `@${userData.name.replace(/\s+/g, "").toLowerCase()}`
            : `@meta_${userData.id || "page"}`
        }
      } else if (cleanPlatform === "linkedin") {
        const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: process.env.LINKEDIN_CLIENT_ID || "",
            client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
          }),
          signal: AbortSignal.timeout(15000),
        })
        const data = await tokenRes.json().catch(() => ({}))
        if (tokenRes.ok && data.access_token) {
          accessToken = data.access_token
          handle = `@linkedin_company`
        }
      } else if (cleanPlatform === "twitter") {
        const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${process.env.TWITTER_CLIENT_ID || ""}:${process.env.TWITTER_CLIENT_SECRET || ""}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code_verifier: "challenge",
          }),
          signal: AbortSignal.timeout(15000),
        })
        const data = await tokenRes.json().catch(() => ({}))
        if (tokenRes.ok && data.access_token) {
          accessToken = data.access_token
          handle = `@x_profile`
        }
      }
    } catch (exchangeErr) {
      console.error("Live OAuth token exchange failure:", exchangeErr)
    }

    if (!accessToken) {
      return NextResponse.redirect(`${appUrl}/social?error=oauth_exchange_failed`)
    }

    // Encrypt the real OAuth token before writing to DB
    await db.socialAccount.create({
      data: {
        agencyId: auth.agencyId,
        platform: platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase(),
        handle: handle || `@${platform.toLowerCase()}_account`,
        accessToken: encryptConfig(accessToken),
        isActive: true,
      },
    })

    return NextResponse.redirect(`${appUrl}/social?success=true`)
  } catch (err) {
    console.error("OAuth Callback Error:", err)
    return NextResponse.redirect(`${appUrl}/social?error=invalid_state`)
  }
}
