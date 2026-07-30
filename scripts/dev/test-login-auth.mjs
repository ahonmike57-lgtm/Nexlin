import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testAuth(email, password) {
  console.log(`\n--- Testing Auth for ${email} / ${password} ---`)
  
  // 1. PlatformAdmin
  const admin = await prisma.platformAdmin.findUnique({
    where: { email }
  })
  
  if (admin) {
    console.log(`Found PlatformAdmin: id=${admin.id}, role=${admin.role}, status=${admin.status}`)
    console.log(`passwordHash in DB: ${admin.passwordHash}`)
    const match = await bcrypt.compare(password, admin.passwordHash).catch(e => {
      console.log('bcrypt compare error:', e)
      return false
    })
    const isDirectMatch = admin.passwordHash === password
    console.log(`bcrypt.compare match: ${match}`)
    console.log(`isDirectMatch: ${isDirectMatch}`)
    console.log(`Overall valid: ${match || isDirectMatch}`)
    return
  }

  // 2. User
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (user) {
    console.log(`Found User: id=${user.id}, role=${user.role}`)
    console.log(`passwordHash in DB: ${user.passwordHash}`)
    const match = await bcrypt.compare(password, user.passwordHash || '').catch(e => false)
    const isDirectMatch = user.passwordHash === password
    console.log(`bcrypt.compare match: ${match}`)
    console.log(`isDirectMatch: ${isDirectMatch}`)
    return
  }

  console.log(`No PlatformAdmin or User found with email: ${email}`)
}

async function main() {
  await testAuth('admin@nexlin.com', 'Admin123!')
  await testAuth('dev@nexlin.com', 'DevPass123!')
  await testAuth('owner@nexlin.com', 'OwnerPass123!')
}

main().finally(() => prisma.$disconnect())
