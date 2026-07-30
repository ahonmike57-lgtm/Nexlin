import { PrismaClient } from "@prisma/client"

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL

if (!connectionString) {
  // Never fall back to a literal connection string. A credential committed to
  // source is public the moment the repo is, and rotating it is the only fix.
  throw new Error(
    "DATABASE_URL (or POSTGRES_PRISMA_URL) is not set. Configure it in your environment / Vercel project settings."
  )
}

const prismaClientSingleton = () => {
  return new PrismaClient({ 
    log: ['error'],
    datasources: {
      db: {
        url: connectionString
      }
    }
  })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const db = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
