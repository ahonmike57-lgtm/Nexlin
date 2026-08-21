import { inngest } from "./client"
import { db } from "@/lib/db"
import { interpolateMergeTags } from "@/lib/merge-tags"
import { pusherServer } from "@/lib/pusher"

export const executeWorkflowEngine = (inngest.createFunction as any)(
  { id: "execute-workflow-engine", event: "workflow.execute" },
  async ({ event, step }: { event: any; step: any }) => {
    const { workflowId, contactId } = event.data

    const workflow = await step.run("fetch-workflow-and-contact", async () => {
      const wf = await db.workflow.findUnique({
        where: { id: workflowId },
        include: { 
          actions: { orderBy: { order: "asc" } },
          agency: { select: { id: true, name: true, customDomain: true, subdomain: true } }
        }
      })

      const contact = contactId ? await db.contact.findUnique({
        where: { id: contactId },
        include: { deals: { take: 1, orderBy: { updatedAt: "desc" } } }
      }) : null

      return { wf, contact }
    })

    if (!workflow?.wf) return { error: "Workflow not found" }

    const { wf, contact } = workflow
    const context = {
      contact: contact || undefined,
      agency: wf.agency || undefined,
      deal: contact?.deals?.[0] || undefined
    }

    for (const action of wf.actions) {
      let config: any = {}
      try {
        if (action.config) config = JSON.parse(action.config)
      } catch (e) {}

      if (action.type === "wait") {
        const duration = config.duration ? `${config.duration}h` : "24h"
        await step.sleep(`wait-${action.id}`, duration)
      } 
      else if (action.type === "send_email") {
        await step.run(`send-email-${action.id}`, async () => {
          const rawSubject = config.subject || `Update from ${wf.agency?.name || "Our Team"}`
          const rawBody = config.body || "Hi {{contact.firstName | 'there'}}, we wanted to follow up with you!"
          
          const personalizedSubject = interpolateMergeTags(rawSubject, context)
          const personalizedBody = interpolateMergeTags(rawBody, context)
          
          console.log(`[Workflow Engine] Sending personalized email to ${contact?.email || contactId}: "${personalizedSubject}"`)
          
          if (contactId) {
            // Record message in thread if conversation exists
            const conv = await db.conversation.findFirst({
              where: { contactId, channel: "email" }
            })
            if (conv) {
              await db.message.create({
                data: {
                  conversationId: conv.id,
                  isOutbound: true,
                  content: `Subject: ${personalizedSubject}\n\n${personalizedBody}`,
                  status: "delivered"
                }
              }).catch(() => {})
            }
          }
        })
      } 
      else if (action.type === "send_sms") {
        await step.run(`send-sms-${action.id}`, async () => {
          const rawText = config.message || "Hi {{contact.firstName | 'there'}}, this is a quick update from {{agency.name}}!"
          const personalizedMessage = interpolateMergeTags(rawText, context)
          console.log(`[Workflow Engine] Sending SMS to ${contact?.phone || contactId}: "${personalizedMessage}"`)
        })
      }
      else if (action.type === "assign_rep") {
        await step.run(`assign-rep-${action.id}`, async () => {
          if (contactId && config.userId) {
            await db.contact.updateMany({
              where: { id: contactId },
              data: { assignedRepId: config.userId }
            }).catch(() => {})
            
            await db.deal.updateMany({
              where: { contactId },
              data: { assignedRepId: config.userId }
            }).catch(() => {})
          }
        })
      }
      else if (action.type === "update_deal_stage") {
        await step.run(`update-stage-${action.id}`, async () => {
          if (contactId && config.stage) {
            await db.deal.updateMany({
              where: { contactId },
              data: { stage: config.stage }
            }).catch(() => {})
          }
        })
      }
      else if (action.type === "post_webhook") {
        await step.run(`post-webhook-${action.id}`, async () => {
          if (config.webhookUrl) {
            try {
              await fetch(config.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "workflow.action",
                  workflowId: wf.id,
                  workflowName: wf.name,
                  contact,
                  timestamp: new Date().toISOString()
                })
              })
            } catch (err) {
              console.warn(`Outbound webhook failed to ${config.webhookUrl}:`, err)
            }
          }
        })
      }
      else if (action.type === "internal_notification") {
        await step.run(`internal-notify-${action.id}`, async () => {
          try {
            const rawMsg = config.message || "Workflow notification: Contact {{contact.fullName}} progressed in {{workflow.name}}"
            const message = interpolateMergeTags(rawMsg, { ...context, customValues: { "workflow.name": wf.name } })
            await pusherServer.trigger(`agency-${wf.agencyId}`, "internal-alert", {
              title: `Workflow: ${wf.name}`,
              message,
              contactId
            })
          } catch (e) {}
        })
      }
    }

    return { success: true, completedActions: wf.actions.length }
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
        try {
          await db.reviewRequest.updateMany({
            where: { id: r.id },
            data: { status: "sent" }
          })
        } catch (e) {
          console.warn(`cronReviewRequests: failed to update review ${r.id}:`, e)
        }
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
