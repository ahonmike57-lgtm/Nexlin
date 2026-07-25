import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.platformAdmin.upsert({
    where: { email: 'admin@nexlin.com' },
    update: { passwordHash: hash, status: 'active' },
    create: {
      email: 'admin@nexlin.com',
      name: 'Super Admin',
      role: 'owner',
      status: 'active',
      passwordHash: hash,
    },
  });
  console.log('Successfully created Platform Admin:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
