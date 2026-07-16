require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const workflows = await prisma.workflow.findMany({ include: { triggers: true, actions: { orderBy: { order: "asc" } } } });
  console.log("Workflows:", JSON.stringify(workflows, null, 2));
}

test().finally(() => prisma.$disconnect());
