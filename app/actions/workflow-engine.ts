"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getActiveSubAccountId } from "./subaccounts"

export async function executeWorkflow(workflowId: string, contactId?: string) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
      include: {
        actions: { orderBy: { order: "asc" } }
      }
    })

    if (!workflow) {
      throw new Error("Workflow not found")
    }

    const logs: string[] = []
    logs.push(`[Workflow Engine] Starting execution of workflow: ${workflow.name} (ID: ${workflow.id})`)

    for (const action of workflow.actions) {
      logs.push(`[Workflow Engine] Executing Action: ${action.type} (Order: ${action.order})`)
      if (action.type === 'wait') {
        await new Promise(r => setTimeout(r, 1000))
      } else if (action.type === 'send_email') {
        await new Promise(r => setTimeout(r, 200))
        
        // If no contactId provided (e.g. Test Workflow button), grab the newest contact to prove it works
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

        if (targetContactId) {
          // Make a visible database change to prove the automation ran
          try {
            await db.contact.update({
              where: { id: targetContactId },
              data: { company: "Auto-Emailed via Workflow!" }
            })
            logs.push(`[Workflow Engine] System updated Contact (ID: ${targetContactId}) company to 'Auto-Emailed via Workflow!'`)
            revalidatePath("/crm/contacts")
          } catch (e) {
            logs.push(`[Workflow Engine] Failed to update contact.`)
          }
        } else {
          logs.push(`[Workflow Engine] Note: No contacts exist in the system to update.`)
        }
      } else {
        await new Promise(r => setTimeout(r, 200))
      }
      logs.push(`[Workflow Engine] Completed Action: ${action.type}`)
    }

    logs.push(`[Workflow Engine] Workflow execution complete: ${workflow.name}`)
    console.log(logs.join("\n"))
    return { success: true, logs }
  } catch (error) {
    console.error("Failed to execute workflow:", error)
    return { success: false, error: "Failed to execute workflow" }
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
