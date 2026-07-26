import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/mock-oauth",
  "/api/auth",
  "/api/health",
  "/_next",
  "/favicon.ico",
]

// Routes that require a PlatformAdmin session
const PLATFORM_PATHS = ["/platform"]

// Routes that require platform Owner or Developer role only
const OWNER_DEV_PATHS = ["/platform/features", "/platform/debug", "/api/debug"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Allow public paths through immediately ──────────────────────────────────
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "nexlin-production-auth-secret-key-2026",
  })

  // ── Unauthenticated — redirect to login ────────────────────────────────────
  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Platform routes — must be a PlatformAdmin ──────────────────────────────
  const isPlatformAdmin = !!(token as any).isPlatformAdmin
  const adminRole = ((token as any).role || "").toLowerCase()

  if (PLATFORM_PATHS.some((p) => pathname.startsWith(p))) {
    if (!isPlatformAdmin) {
      // Tenant user trying to reach /platform — redirect to their dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // /platform/debug and /platform/features — Owner or Developer only
    if (OWNER_DEV_PATHS.some((p) => pathname.startsWith(p))) {
      if (adminRole !== "owner" && adminRole !== "developer") {
        return NextResponse.redirect(new URL("/platform", req.url))
      }
    }
  }

  // ── /api/debug — Owner or Developer only ───────────────────────────────────
  if (pathname.startsWith("/api/debug")) {
    if (!isPlatformAdmin || (adminRole !== "owner" && adminRole !== "developer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  // ── Tenant users cannot reach platform routes ── already handled above ─────
  // ── Platform admins impersonating — allow dashboard routes ─────────────────

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public API routes handled in PUBLIC_PATHS above
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
