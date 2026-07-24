import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const agencies = await prisma.agency.count()
    console.log('Agencies:', agencies)
    const activeAgencies = await prisma.agency.count({ where: { status: 'active' } })
    console.log('Active Agencies:', activeAgencies)
    const apps = await prisma.tenantApp.count()
    console.log('Apps:', apps)
    const admins = await prisma.platformAdmin.count()
    console.log('Admins:', admins)
  } catch (e) {
    console.error('Error:', e)
  }
}
main().finally(() => prisma.$disconnect())
