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

export const cronReviewRequests = (inngest.createFunction as any)(
  { id: "cron-daily-review-requests", cron: "0 9 * * *" },
  async ({ step }: { step: any }) => {
    const pendingRequests = await step.run("process-review-requests", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const reviews = await db.reviewRequest.findMany({
        where: { status: "pending", createdAt: { gte: yesterday } },
        take: 50
      })
      
      for (const r of reviews) {
        await db.reviewRequest.update({
          where: { id: r.id },
          data: { status: "sent" }
        })
      }

      return reviews.length
    })

    return { success: true, processed: pendingRequests }
  }
)

export const cronUsageRebillingSync = (inngest.createFunction as any)(
  { id: "cron-hourly-rebilling-sync", cron: "0 * * * *" },
  async ({ step }: { step: any }) => {
    const activeAgencies = await step.run("reconcile-agencies", async () => {
      const agencies = await db.agency.findMany({
        where: { status: "active" },
        select: { id: true, name: true, planTier: true }
      })

      return agencies.length
    })

    return { success: true, activeAgencies }
  }
)
