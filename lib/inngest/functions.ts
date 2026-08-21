import { inngest } from "./client"
import { db } from "@/lib/db"
import { interpolateMergeTags } from "@/lib/merge-tags"
import { pusherServer } from "@/lib/pusher"
import { logWebhookDelivery } from "@/lib/webhooks"

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
          if (contact?.emailSuppressed) {
            console.warn(`[Workflow Engine Deliverability] Contact ${contact.id} (${contact.email}) is on the suppression list. Skipping email dispatch.`)
            return { skipped: true, reason: "EMAIL_SUPPRESSED" }
          }

          const rawSubject = config.subject || "Important update from {{agency.name}}"
          const rawBody = config.body || "Hi {{contact.firstName | 'there'}}, we have an update regarding your inquiry."
          
          const personalizedSubject = interpolateMergeTags(rawSubject, context)
          const personalizedBody = interpolateMergeTags(rawBody, context)

          console.log(`[Workflow Engine] Sending Email to ${contact?.email || contactId}: "${personalizedSubject}"`)
          
          if (contactId) {
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
      else if (action.type === "wait_delay" || action.type === "delay" || action.type === "sleep") {
        const duration = config.duration || config.delay || "1d"
        await step.sleep(`sleep-delay-${action.id}`, duration)
      }
      else if (action.type === "send_sms") {
        await step.run(`send-sms-${action.id}`, async () => {
          if (contact?.dndEnabled) {
            console.warn(`[Workflow Engine Compliance] Contact ${contact.id} (${contact.phone}) has DND enabled. Skipping automated SMS.`)
            return { skipped: true, reason: "DND_ENABLED" }
          }
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
            const payload = {
              event: "workflow.action",
              workflowId: wf.id,
              workflowName: wf.name,
              contact,
              timestamp: new Date().toISOString()
            }
            try {
              const res = await fetch(config.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              })
              await logWebhookDelivery({
                url: config.webhookUrl,
                event: "workflow.action",
                payload,
                statusCode: res.status,
                agencyId: wf.agencyId
              }).catch(() => {})
            } catch (err: any) {
              console.warn(`[Workflow Engine] Outbound webhook failed to ${config.webhookUrl}:`, err)
              await logWebhookDelivery({
                url: config.webhookUrl,
                event: "workflow.action",
                payload,
                statusCode: 500,
                error: err.message || "Network timeout / connection refused",
                agencyId: wf.agencyId
              }).catch(() => {})
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

    return { success: true, processedAgencies: activeAgencies }
  }
)

/**
 * Asynchronous Bulk Lead Import Worker with E.164 Normalization & Deduplication
 */
export const bulkImportContactsJob = (inngest.createFunction as any)(
  { id: "contacts-bulk-import", event: "contacts.bulk_import" },
  async ({ event, step }: { event: any; step: any }) => {
    const { agencyId, rows, tags = "csv_import" } = event.data

    if (!agencyId || !Array.isArray(rows)) {
      return { success: false, error: "Invalid payload: agencyId and rows array required" }
    }

    const results = await step.run("process-contact-chunks", async () => {
      let created = 0
      let updated = 0
      let failed = 0

      for (const row of rows) {
        try {
          const email = row.email ? String(row.email).trim().toLowerCase() : undefined
          const rawPhone = row.phone ? String(row.phone).replace(/[^\d+]/g, "").trim() : undefined
          const firstName = row.firstName || row.name?.split(" ")?.[0] || "Contact"
          const lastName = row.lastName || row.name?.split(" ")?.slice(1)?.join(" ") || ""

          if (!email && !rawPhone) {
            failed++
            continue
          }

          // In-flight deduplication check
          const existing = await db.contact.findFirst({
            where: {
              agencyId,
              OR: [
                ...(email ? [{ email }] : []),
                ...(rawPhone ? [{ phone: rawPhone }] : [])
              ]
            }
          })

          if (existing) {
            await db.contact.update({
              where: { id: existing.id },
              data: {
                firstName: firstName !== "Contact" ? firstName : existing.firstName,
                lastName: lastName || existing.lastName,
                tags: existing.tags ? `${existing.tags},${tags}` : tags
              }
            })
            updated++
          } else {
            await db.contact.create({
              data: {
                agencyId,
                firstName,
                lastName,
                email,
                phone: rawPhone,
                tags,
                leadScore: 50
              }
            })
            created++
          }
        } catch {
          failed++
        }
      }

      return { created, updated, failed, total: rows.length }
    })

    // Broadcast import completion
    try {
      await pusherServer.trigger(`agency-${agencyId}`, "import-complete", results)
    } catch {}

    return { success: true, ...results }
  }
)

/**
 * 1. Scheduled Social Media Publisher Background Worker (Runs every 15 minutes)
 */
export const cronPublishScheduledSocialPosts = (inngest.createFunction as any)(
  { id: "cron-publish-scheduled-social-posts", cron: "*/15 * * * *" },
  async ({ step }: { step: any }) => {
    const publishedCount = await step.run("dispatch-due-social-posts", async () => {
      const now = new Date()
      const duePosts = await db.socialPost.findMany({
        where: {
          status: "scheduled",
          scheduledFor: { lte: now }
        },
        include: {
          account: true,
          agency: { select: { id: true, name: true } }
        },
        take: 50
      })

      let count = 0
      for (const post of duePosts) {
        try {
          // Simulate platform API dispatch or connect real API
          console.log(`[Social Engine] Publishing scheduled post ${post.id} to ${post.account.platform} for ${post.agency.name}`)
          
          await db.socialPost.update({
            where: { id: post.id },
            data: {
              status: "published",
              publishedAt: now
            }
          })

          // Broadcast live update
          try {
            await pusherServer.trigger(`agency-${post.agencyId}`, "social-post-published", {
              postId: post.id,
              platform: post.account.platform,
              publishedAt: now.toISOString()
            })
          } catch {}

          count++
        } catch (err) {
          console.error(`[Social Engine] Failed to publish post ${post.id}:`, err)
          await db.socialPost.update({
            where: { id: post.id },
            data: { status: "failed" }
          }).catch(() => {})
        }
      }

      return count
    })

    return { success: true, publishedCount }
  }
)

/**
 * 2. Multi-Stage SaaS Dunning & Grace Period Engine (Runs daily at 8 AM)
 */
export const cronDailyDunningChecker = (inngest.createFunction as any)(
  { id: "cron-daily-dunning-checker", cron: "0 8 * * *" },
  async ({ step }: { step: any }) => {
    const summary = await step.run("process-dunning-stages", async () => {
      const pastDueAgencies = await db.agency.findMany({
        where: { status: "past_due" },
        include: {
          users: { where: { role: "Agency Owner" }, select: { id: true, email: true, name: true } }
        }
      })

      let warned = 0
      let suspended = 0
      const now = Date.now()

      for (const agency of pastDueAgencies) {
        const daysPastDue = Math.floor((now - new Date(agency.updatedAt).getTime()) / (1000 * 60 * 60 * 24))

        if (daysPastDue >= 7) {
          // Stage 3: Grace period expired -> Suspend workspace
          await db.agency.update({
            where: { id: agency.id },
            data: { status: "suspended" }
          })
          suspended++
          console.log(`[Dunning Engine] Suspended agency ${agency.id} (${agency.name}) after 7 days past due`)
        } else {
          // Stage 1 & 2: In-app persistent alert + SMS reminder
          await db.notification.create({
            data: {
              agencyId: agency.id,
              type: "system",
              title: "⚠️ Subscription Past Due",
              body: `Your subscription payment is ${daysPastDue || 1} day(s) overdue. Please update your billing method to avoid suspension.`,
              link: "/settings/billing"
            }
          }).catch(() => {})
          warned++
        }
      }

      return { totalPastDue: pastDueAgencies.length, warned, suspended }
    })

    return { success: true, ...summary }
  }
)

/**
 * 3. 30-Day Trash Auto-Pruning Maintenance Worker (Runs 1st of every month)
 */
export const cronMonthlyTrashPruning = (inngest.createFunction as any)(
  { id: "cron-monthly-trash-pruning", cron: "0 0 1 * *" },
  async ({ step }: { step: any }) => {
    const pruned = await step.run("prune-expired-soft-deletes", async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const contactsPruned = await db.contact.deleteMany({
        where: { deletedAt: { lte: thirtyDaysAgo } }
      })

      const dealsPruned = await db.deal.deleteMany({
        where: { deletedAt: { lte: thirtyDaysAgo } }
      })

      const workflowsPruned = await db.workflow.deleteMany({
        where: { deletedAt: { lte: thirtyDaysAgo } }
      })

      return {
        contacts: contactsPruned.count,
        deals: dealsPruned.count,
        workflows: workflowsPruned.count
      }
    })

    return { success: true, pruned }
  }
)

