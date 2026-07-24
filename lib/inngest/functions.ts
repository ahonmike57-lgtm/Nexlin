import { inngest } from "./client"
import { db } from "@/lib/db"

export const executeWorkflowEngine = (inngest.createFunction as any)(
  { id: "execute-workflow-engine", event: "workflow.execute" },
  async ({ event, step }: { event: any; step: any }) => {
    const { workflowId, contactId } = event.data

    const workflow = await step.run("fetch-workflow", async () => {
      return await db.workflow.findUnique({
        where: { id: workflowId },
        include: { actions: { orderBy: { order: "asc" } } }
      })
    })

    if (!workflow) return { error: "Workflow not found" }

    for (const action of workflow.actions) {
      if (action.type === "wait") {
        let duration = "24h"
        try {
          if (action.config) {
            const parsed = JSON.parse(action.config)
            if (parsed.duration) {
              duration = `${parsed.duration}h`
            }
          }
        } catch (e) {}
        
        await step.sleep(`wait-${action.id}`, duration)
      } else if (action.type === "send_email") {
        await step.run(`send-email-${action.id}`, async () => {
          console.log(`[Inngest] Executing send_email for contact ${contactId} in workflow ${workflow.name}`)
          // Mock sending email
          if (contactId) {
            await db.contact.update({
              where: { id: contactId },
              data: { company: "Emailed via Inngest Drip!" }
            })
          }
        })
      } else if (action.type === "send_sms") {
        await step.run(`send-sms-${action.id}`, async () => {
          console.log(`[Inngest] Executing send_sms for contact ${contactId} in workflow ${workflow.name}`)
        })
      }
    }

    return { success: true, completedActions: workflow.actions.length }
  }
)
