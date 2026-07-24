import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get("platform")
  const agencyId = searchParams.get("agencyId")

  if (!platform || !agencyId) {
    return NextResponse.json({ error: "Missing platform or agencyId" }, { status: 400 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/callback`
  const state = Buffer.from(JSON.stringify({ agencyId, platform })).toString('base64')

  let authUrl = ""

  switch (platform.toLowerCase()) {
    case "facebook":
    case "instagram":
      authUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID || 'MOCK_FB_ID'}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish`
      break
    case "linkedin":
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID || 'MOCK_LI_ID'}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=r_liteprofile,r_emailaddress,w_member_social`
      break
    case "twitter":
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID || 'MOCK_TW_ID'}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=tweet.read,tweet.write,users.read&code_challenge=challenge&code_challenge_method=plain`
      break
    default:
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 })
  }

  // If no real Client IDs are provided in .env, we redirect to a mock consent screen
  if (authUrl.includes("MOCK_")) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mock-oauth?state=${state}`)
  }

  return NextResponse.redirect(authUrl)
}
