import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { verifyTotpCode } from "@/lib/totp"
import bcrypt from "bcryptjs"

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET

if (!authSecret) {
  // Fail fast rather than silently falling back to a shared, public constant.
  // A predictable secret lets anyone forge a session JWT for any account.
  throw new Error(
    "NEXTAUTH_SECRET (or AUTH_SECRET) is not set. Generate one with: openssl rand -base64 32"
  )
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GithubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const cleanEmail = credentials.email.trim().toLowerCase()
        const cleanPassword = credentials.password.trim()

        // 1. Check PlatformAdmin
        const admin = await db.platformAdmin.findFirst({
          where: { email: { equals: cleanEmail, mode: "insensitive" } }
        })
        
        if (admin && admin.passwordHash) {
          const isValid = await bcrypt.compare(cleanPassword, admin.passwordHash).catch(() => false)
          const isActive = admin.status === "active"

          if (isValid && isActive) {
            await db.platformAdmin.update({
              where: { id: admin.id },
              data: { lastLoginAt: new Date() }
            }).catch(() => {})
            
            return { 
              id: admin.id, 
              name: admin.name || "Platform Admin", 
              email: admin.email, 
              role: admin.role, 
              isPlatformAdmin: true
            } as any
          }
        }
        
        // 2. Check User (Tenant)
        const user = await db.user.findFirst({
          where: { email: { equals: cleanEmail, mode: "insensitive" } }
        })

        if (user && user.passwordHash) {
          const isValidUser = await bcrypt.compare(cleanPassword, user.passwordHash).catch(() => false)

          if (isValidUser) {
            if (user.twoFactorEnabled && user.twoFactorSecret) {
              const rawCode = (credentials.totpCode || "").trim()
              if (!rawCode) {
                throw new Error("2FA_REQUIRED")
              }

              let verified = verifyTotpCode(user.twoFactorSecret, rawCode)

              if (!verified && user.backupCodes) {
                let storedHashes: string[] = []
                try {
                  const parsed = JSON.parse(user.backupCodes)
                  if (Array.isArray(parsed)) storedHashes = parsed
                } catch {}

                const candidate = rawCode.replace(/-/g, "").trim().toUpperCase()
                for (let i = 0; i < storedHashes.length; i++) {
                  const matched = await bcrypt.compare(candidate, storedHashes[i]).catch(() => false)
                  if (matched) {
                    const remaining = storedHashes.filter((_, idx) => idx !== i)
                    await db.user.update({
                      where: { id: user.id },
                      data: { backupCodes: JSON.stringify(remaining) }
                    })
                    verified = true
                    break
                  }
                }
              }

              if (!verified) {
                throw new Error("INVALID_2FA_CODE")
              }
            }

            return { 
              id: user.id, 
              name: user.name, 
              email: user.email, 
              role: user.role, 
              isAfricaUser: user.isAfricaUser,
              agencyId: user.agencyId
            } as any
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role
        token.isAfricaUser = (user as any).isAfricaUser
        token.isPlatformAdmin = (user as any).isPlatformAdmin
        token.agencyId = (user as any).agencyId
      }
      
      // Impersonation Support (start & stop)
      if (trigger === "update" && session && "impersonateAgencyId" in session) {
        if (session.impersonateAgencyId === null) {
          token.agencyId = undefined
          token.isImpersonating = false
        } else if (typeof session.impersonateAgencyId === "string" && token.isPlatformAdmin && token.sub) {
          const admin = await db.platformAdmin.findUnique({
            where: { id: token.sub },
            select: { status: true, role: true }
          })
          if (admin && admin.status === "active" && ["owner", "developer", "support"].includes(admin.role)) {
            const targetAgency = await db.agency.findUnique({
              where: { id: session.impersonateAgencyId },
              select: { id: true }
            })
            if (targetAgency) {
              token.agencyId = targetAgency.id
              token.isImpersonating = true
            }
          }
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).isAfricaUser = token.isAfricaUser;
        (session.user as any).isPlatformAdmin = token.isPlatformAdmin;
        (session.user as any).agencyId = token.agencyId;
        (session.user as any).isImpersonating = token.isImpersonating;
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
