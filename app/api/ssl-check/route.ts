import { type NextRequest, NextResponse } from "next/server"

/**
 * Proxy for crt.sh SSL certificate lookups.
 * crt.sh does NOT send CORS headers, so browser fetch() is blocked.
 * This server-side route fetches on behalf of the client.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get("domain")

  if (!domain || !/^[a-zA-Z0-9._-]+$/.test(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`, {
      headers: { Accept: "application/json" },
      // 10-second timeout
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      return NextResponse.json({ certs: [] })
    }

    const certs = await res.json()
    return NextResponse.json({ certs })
  } catch (err: any) {
    return NextResponse.json({ certs: [], error: err.message ?? "Upstream fetch failed" })
  }
}
