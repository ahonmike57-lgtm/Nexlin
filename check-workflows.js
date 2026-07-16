const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const workflows = await prisma.workflow.findMany({
    include: { triggers: true, actions: true }
  });
  console.log(JSON.stringify(workflows, null, 2));
}

check().finally(() => prisma.$disconnect());
