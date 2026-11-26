import crypto from "crypto"
import { NextResponse } from "next/server"
import { requireTenantAuth } from "@/lib/permissions"

export async function GET(request: Request) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get("platform")?.trim().toLowerCase()
  const requestedAgencyId = searchParams.get("agencyId")?.trim()

  if (!platform) {
    return NextResponse.json({ error: "Missing platform" }, { status: 400 })
  }

  if (requestedAgencyId && requestedAgencyId !== auth.agencyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const stateSecret = (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)?.trim()
  if (!stateSecret) {
    return NextResponse.json({ error: "OAuth state secret not configured" }, { status: 503 })
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    new URL(request.url).origin
  ).replace(/\/$/, "")

  const redirectUri = `${appUrl}/api/oauth/callback`
  const payloadB64 = Buffer.from(
    JSON.stringify({
      agencyId: auth.agencyId,
      platform,
      ts: Date.now(),
    })
  ).toString("base64url")
  const signature = crypto.createHmac("sha256", stateSecret).update(payloadB64).digest("hex")
  const state = `${payloadB64}.${signature}`

  let authUrl = ""

  switch (platform) {
    case "facebook":
    case "instagram": {
      const clientId = process.env.FACEBOOK_CLIENT_ID?.trim()
      if (!clientId) {
        return NextResponse.redirect(
          `${appUrl}/social?error=oauth_not_configured&platform=${encodeURIComponent(platform)}`
        )
      }
      authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish`
      break
    }
    case "linkedin": {
      const clientId = process.env.LINKEDIN_CLIENT_ID?.trim()
      if (!clientId) {
        return NextResponse.redirect(
          `${appUrl}/social?error=oauth_not_configured&platform=${encodeURIComponent(platform)}`
        )
      }
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=r_liteprofile,r_emailaddress,w_member_social`
      break
    }
    case "twitter": {
      const clientId = process.env.TWITTER_CLIENT_ID?.trim()
      if (!clientId) {
        return NextResponse.redirect(
          `${appUrl}/social?error=oauth_not_configured&platform=${encodeURIComponent(platform)}`
        )
      }
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=tweet.read,tweet.write,users.read&code_challenge=challenge&code_challenge_method=plain`
      break
    }
    default:
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 })
  }

  return NextResponse.redirect(authUrl)
}
