import { NextResponse } from "next/server"
import { requireTenantAuth } from "@/lib/permissions"

export async function POST(req: Request) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const cleanDomain = typeof body?.domain === "string" ? body.domain.trim().toLowerCase() : ""
    if (!cleanDomain || !cleanDomain.includes(".")) {
      return NextResponse.json({ error: "A valid domain is required" }, { status: 400 })
    }

    const vercelToken = process.env.VERCEL_API_TOKEN?.trim()
    const vercelProjectId = process.env.VERCEL_PROJECT_ID?.trim()
    if (!vercelToken || !vercelProjectId) {
      return NextResponse.json(
        { error: "Vercel Domains API not configured (VERCEL_API_TOKEN / VERCEL_PROJECT_ID missing)" },
        { status: 501 }
      )
    }

    const teamId = process.env.VERCEL_TEAM_ID?.trim()
    const apiUrl = new URL(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(vercelProjectId)}/domains`
    )
    if (teamId) {
      apiUrl.searchParams.set("teamId", teamId)
    }

    const vercelRes = await fetch(apiUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: cleanDomain }),
      signal: AbortSignal.timeout(15000),
    })

    const data = await vercelRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: vercelRes.status })
  } catch (error: any) {
    console.error("Vercel Domains API error:", error)
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 })
  }
}
