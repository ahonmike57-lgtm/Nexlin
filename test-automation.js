const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const agencyId = 'cluz12345000008l412345678';
  
  // Create a fake active workflow
  const workflow = await prisma.workflow.create({
    data: {
      agencyId,
      name: "Test Automation",
      status: "active",
      triggers: {
        create: [{ type: "contact_created" }]
      },
      actions: {
        create: [{ type: "send_email", order: 0 }]
      }
    }
  });

  console.log("Created Workflow ID:", workflow.id);

  // Now simulate creating a contact
  const contact = await prisma.contact.create({
    data: {
      agencyId,
      firstName: "TestUserAutomated"
    }
  });
  
  console.log("Created Contact ID:", contact.id);

  // Run the logic from triggerWorkflows
  const activeWorkflows = await prisma.workflow.findMany({
    where: {
      agencyId,
      status: "active",
      triggers: {
        some: { type: "contact_created" }
      }
    }
  });

  console.log("Active Workflows Found:", activeWorkflows.length);

  for (const wf of activeWorkflows) {
    console.log(`Executing WF ${wf.id} on Contact ${contact.id}`);
    
    // logic from executeWorkflow
    const wfDb = await prisma.workflow.findUnique({
      where: { id: wf.id },
      include: { actions: { orderBy: { order: "asc" } } }
    });

    for (const action of wfDb.actions) {
      if (action.type === 'send_email') {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { company: "Auto-Emailed via Workflow!" }
        });
      }
    }
  }

  const updatedContact = await prisma.contact.findUnique({ where: { id: contact.id } });
  console.log("Final Contact Company:", updatedContact.company);
}

test().finally(() => prisma.$disconnect());
