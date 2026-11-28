import { NextResponse } from "next/server"
import { checkRateLimitAsync } from "@/lib/rate-limit"
import { reportServerError } from "@/lib/monitoring"

export async function POST(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"

  const rl = await checkRateLimitAsync(`client-err:${ip}`, {
    maxRequests: 30,
    windowSeconds: 60,
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many error reports" },
      { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } }
    )
  }

  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid error payload" }, { status: 400 })
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.slice(0, 120) : "ClientError"
  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.slice(0, 1000)
      : "Unknown client error"

  await reportServerError(
    { name, message, digest: typeof body.digest === "string" ? body.digest.slice(0, 120) : undefined },
    {
      source: "client-boundary",
      boundary: typeof body.boundary === "string" ? body.boundary.slice(0, 40) : "unknown",
      path: typeof body.path === "string" ? body.path.slice(0, 200) : "/",
      isSkew: Boolean(body.isSkew),
    }
  )

  return NextResponse.json({ ok: true })
}
