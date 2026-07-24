import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/social?error=${error}`)
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 })
  }

  try {
    const { agencyId, platform } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'))

    let accessToken = ""
    let handle = ""

    // MOCK EXCHANGE
    if (code.startsWith("MOCK_CODE_")) {
      accessToken = `mock_access_token_${Math.random().toString(36).substring(7)}`
      handle = `@${platform}_user`
    } else {
      // REAL EXCHANGE LOGIC (Placeholder for when real API keys are added)
      // accessToken = await exchangeCodeForToken(platform, code)
      // handle = await fetchUserProfile(platform, accessToken)
      accessToken = `real_access_token_stub`
      handle = `@real_${platform}_user`
    }

    // Save to DB
    await db.socialAccount.create({
      data: {
        agencyId,
        platform: platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase(),
        handle,
        accessToken,
        isActive: true
      }
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/social?success=true`)
  } catch (err) {
    console.error("OAuth Callback Error:", err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/social?error=invalid_state`)
  }
}
