import { PrismaClient } from "@prisma/client"

const connectionString = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_PRISMA_URL || 
  "postgres://postgres.zfnnukdfjplymakfssqh:sip6DEfB95vbIB3O@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

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
