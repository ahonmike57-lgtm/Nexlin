import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/crm/:path*",
    "/funnels/:path*",
    "/marketing/:path*",
    "/chat/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ]
}
