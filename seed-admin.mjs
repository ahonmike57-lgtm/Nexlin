import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error(
    'Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding.\n' +
    'Example: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD="$(openssl rand -base64 24)" node seed-admin.mjs'
  );
  process.exit(1);
}

async function main() {
  const hash = await bcrypt.hash(password, 12);
  const admin = await prisma.platformAdmin.upsert({
    where: { email },
    update: { passwordHash: hash, status: 'active' },
    create: {
      email,
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
