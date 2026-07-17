import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const hostname = req.headers.get("host")!.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-custom-domain", hostname)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname
        const publicPaths = ["/login", "/register", "/forgot-password", "/"]
        
        if (publicPaths.includes(path)) {
          return true // Allow access without token
        }
        
        return !!token // Require token for all other routes
      }
    }
  }
)

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ]
}
