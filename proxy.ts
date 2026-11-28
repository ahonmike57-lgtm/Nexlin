import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Public paths that never require a token
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/",
]

// Reserved application prefixes that are never rewritten as custom-domain funnel pages
const APP_RESERVED_PREFIXES = [
  "/api/",
  "/_next/",
  "/f/",
  "/forms",
  "/review/",
  "/blog",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/dashboard",
  "/platform",
  "/settings",
  "/onboarding",
]

// Platform routes that require a platform admin session
const PLATFORM_PATHS = ["/platform"]

// Owner/Developer only sub-paths within the platform
const OWNER_DEV_PATHS = ["/platform/features", "/platform/debug"]

function extractHostname(value?: string | null): string {
  if (!value) return ""
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ""
  try {
    if (trimmed.includes("://")) {
      return new URL(trimmed).hostname.toLowerCase().replace(/\.$/, "")
    }
  } catch {}
  return trimmed.split("/")[0].replace(/:\d+$/, "").replace(/\.$/, "")
}

export function isCustomDomainHost(
  rawHost: string,
  rootDomainEnv: string | undefined = process.env.NEXT_PUBLIC_ROOT_DOMAIN
): string | null {
  const host = extractHostname(rawHost)
  if (!host) return null

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".localhost") ||
    host.endsWith(".vercel.app")
  ) {
    return null
  }

  const configuredHosts = new Set<string>()
  for (const candidate of [
    rootDomainEnv,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]) {
    const parsed = extractHostname(candidate)
    if (parsed) {
      configuredHosts.add(parsed)
      configuredHosts.add(parsed.startsWith("www.") ? parsed.slice(4) : `www.${parsed}`)
    }
  }

  if (configuredHosts.has(host)) {
    return null
  }

  return host
}

function isCustomDomainPublicPath(path: string, rawHost: string): string | null {
  const customHost = isCustomDomainHost(rawHost)
  if (!customHost) return null
  if (APP_RESERVED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return null
  }
  return customHost
}

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const token = (req as any).nextauth?.token

    // ── Forward custom domain header ──────────────────
    const rawHost = req.headers.get("host") || ""
    const hostname = rawHost.replace(
      ".localhost:3000",
      `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"}`
    )
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-custom-domain", hostname)

    // ── Custom-domain rewrite for published client websites/funnels ───────
    const customHost = isCustomDomainPublicPath(pathname, rawHost)
    if (customHost && !req.headers.get("x-internal-domain-resolve")) {
      try {
        const resolveUrl = new URL(
          `/api/domains/resolve?host=${encodeURIComponent(customHost)}`,
          req.nextUrl.origin
        )
        const res = await fetch(resolveUrl, {
          signal: AbortSignal.timeout(1500),
          headers: { "x-internal-domain-resolve": "1" },
        })
        if (res.ok) {
          const data = (await res.json()) as { subdomain?: unknown }
          if (
            typeof data?.subdomain === "string" &&
            /^[a-z0-9-]+$/i.test(data.subdomain)
          ) {
            const targetPath =
              pathname === "/" ? `/f/${data.subdomain}` : `/f/${data.subdomain}${pathname}`
            return NextResponse.rewrite(new URL(targetPath, req.url), {
              request: { headers: requestHeaders },
            })
          }
        }
      } catch {
        // Fail open so temporary resolution hiccups never break app routing
      }
    }

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
          "/api/domains/resolve",
          "/api/health",
          "/api/webhooks",
          "/api/inngest",
          "/api/voice/incoming",
          "/api/twilio/incoming-call",
          "/api/v1/webhooks/inbound/",
          "/api/forge/submit",
          "/api/geo",
          "/api/og",
          "/api/t/",
          "/blog",
          "/review/",
          "/forms",
          "/f/",
          "/_next",
          "/favicon.ico",
        ]
        if (publicPrefixes.some((p) => path.startsWith(p))) return true

        // Allow unauthenticated visitors on connected custom domains for non-app paths
        if (isCustomDomainPublicPath(path, req.headers.get("host") || "")) {
          return true
        }

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
