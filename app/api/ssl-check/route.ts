import { type NextRequest, NextResponse } from "next/server"
import { requireTenantAuth } from "@/lib/permissions"
import { checkRateLimit } from "@/lib/rate-limit"

/**
 * Proxy for crt.sh SSL certificate lookups.
 * crt.sh does NOT send CORS headers, so browser fetch() is blocked.
 * This server-side route fetches on behalf of authenticated workspace users.
 */
export async function GET(request: NextRequest) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 })
  }

  const rateLimit = checkRateLimit(`ssl-check:${auth.userId}`, {
    maxRequests: 20,
    windowSeconds: 60,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many SSL lookup requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
    )
  }

  const { searchParams } = new URL(request.url)
  const domain = searchParams.get("domain")

  if (!domain || !/^[a-zA-Z0-9._-]+$/.test(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`, {
      headers: { Accept: "application/json" },
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
