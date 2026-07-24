import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        // 1. Check PlatformAdmin
        const admin = await db.platformAdmin.findUnique({
          where: { email: credentials.email }
        })
        
        if (admin && admin.passwordHash === credentials.password) {
          await db.platformAdmin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() }
          })
          
          return { 
            id: admin.id, 
            name: admin.name, 
            email: admin.email, 
            role: admin.role, 
            isPlatformAdmin: true
          } as any
        }
        
        // 2. Check User (Tenant)
        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = credentials.password === user.passwordHash

        if (isValid) {
          return { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            isAfricaUser: user.isAfricaUser,
            agencyId: user.agencyId
          } as any
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
      
      // Impersonation Support
      if (trigger === "update" && session?.impersonateAgencyId) {
        if (token.isPlatformAdmin) {
          token.agencyId = session.impersonateAgencyId
          token.isImpersonating = true
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
