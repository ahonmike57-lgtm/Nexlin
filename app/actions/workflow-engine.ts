"use server"

import { db } from "@/lib/db"
import { getActiveSubAccountId } from "./subaccounts"
import { inngest } from "@/lib/inngest/client"

export async function executeWorkflow(workflowId: string, contactId?: string) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
    })

    if (!workflow) {
      throw new Error("Workflow not found")
    }

    let targetContactId = contactId
    if (!targetContactId) {
      const subAgencyId = await getActiveSubAccountId()
      const whereClause: any = {}
      if (subAgencyId) {
        whereClause.subAgencyId = subAgencyId
      }
      const fallback = await db.contact.findFirst({ where: whereClause, orderBy: { createdAt: "desc" } })
      if (fallback) targetContactId = fallback.id
    }

    await inngest.send({
      name: "workflow.execute",
      data: {
        workflowId,
        contactId: targetContactId
      }
    })

    return { success: true, logs: ["Dispatched to Inngest"] }
  } catch (error) {
    console.error("Failed to execute workflow:", error)
    return { success: false, error: "Failed to dispatch workflow" }
  }
}

export async function triggerWorkflows(agencyId: string, eventType: string, payload?: any) {
  try {
    const subAgencyId = await getActiveSubAccountId()
    const whereClause: any = {
      agencyId,
      status: "active",
      triggers: {
        some: { type: eventType }
      }
    }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    const activeWorkflows = await db.workflow.findMany({
      where: whereClause
    })

    console.log(`[Workflow Engine] Found ${activeWorkflows.length} active workflows for event: ${eventType}`)

    for (const workflow of activeWorkflows) {
      await executeWorkflow(workflow.id, payload?.contactId).catch(console.error)
    }

    return { success: true, count: activeWorkflows.length }
  } catch (error) {
    console.error("Failed to trigger workflows:", error)
    return { success: false }
  }
}
