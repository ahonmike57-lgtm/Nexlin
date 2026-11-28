import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const HOST_REGEX = /^[a-z0-9.-]{1,253}$/

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rawHost = searchParams.get("host") || ""
  const host = rawHost.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "")

  if (!host || !HOST_REGEX.test(host) || !host.includes(".")) {
    return NextResponse.json({ subdomain: null }, { status: 400 })
  }

  const candidates = [
    host,
    host.startsWith("www.") ? host.slice(4) : `www.${host}`,
  ]

  try {
    const funnel = await db.funnel.findFirst({
      where: {
        OR: candidates.map((candidate) => ({
          customDomain: { equals: candidate, mode: "insensitive" },
        })),
        status: { in: ["published", "active"] },
      },
      select: { subdomain: true },
    })

    return NextResponse.json(
      { subdomain: funnel?.subdomain ?? null },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    )
  } catch (error) {
    console.error("Failed to resolve custom domain:", error)
    return NextResponse.json({ subdomain: null }, { status: 500 })
  }
}
