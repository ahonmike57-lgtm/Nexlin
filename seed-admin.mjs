import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.platformAdmin.upsert({
    where: { email: 'admin@nexlin.com' },
    update: { passwordHash: 'Admin123!' },
    create: {
      email: 'admin@nexlin.com',
      name: 'Super Admin',
      role: 'owner',
      passwordHash: 'Admin123!',
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
