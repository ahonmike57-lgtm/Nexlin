import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Public paths that never require a token
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/mock-oauth",
  "/",
]

// Platform routes that require a platform admin session
const PLATFORM_PATHS = ["/platform"]

// Owner/Developer only sub-paths within the platform
const OWNER_DEV_PATHS = ["/platform/features", "/platform/debug"]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = (req as any).nextauth?.token

    // ── Forward custom domain header ──────────────────
    const hostname = req.headers.get("host")!.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'}`)
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-custom-domain", hostname)

    // ── /api/debug — owner/developer only ─────────────────────────────────
    if (pathname.startsWith("/api/debug")) {
      const isPlatformAdmin = !!(token as any)?.isPlatformAdmin
      const role = ((token as any)?.role || "").toLowerCase()
      if (!isPlatformAdmin || (role !== "owner" && role !== "developer")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // ── Platform routes — platform admins only ────────────────────────────
    if (PLATFORM_PATHS.some((p) => pathname.startsWith(p))) {
      const isPlatformAdmin = !!(token as any)?.isPlatformAdmin
      if (!isPlatformAdmin) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }

      // /platform/debug and /platform/features — owner/developer only
      if (OWNER_DEV_PATHS.some((p) => pathname.startsWith(p))) {
        const role = ((token as any)?.role || "").toLowerCase()
        if (role !== "owner" && role !== "developer") {
          return NextResponse.redirect(new URL("/platform", req.url))
        }
      }
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname

        // Paths that never need a token
        if (PUBLIC_PATHS.includes(path)) return true

        // StartsWith checks for prefix-matched public paths
        const publicPrefixes = [
          "/api/auth",
          "/api/health",
          "/api/webhooks",
          "/_next",
          "/favicon.ico",
        ]
        if (publicPrefixes.some((p) => path.startsWith(p))) return true

        // Everything else requires a valid token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static files, and images
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
