import { db } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"
import { deliverMessage } from "@/lib/messaging"
import { interpolateMergeTags, type MergeTagContext } from "@/lib/merge-tags"
import { pusherServer } from "@/lib/pusher"
import { assertSafeOutboundUrl } from "@/lib/ssrf"
import { logWebhookDelivery } from "@/lib/webhooks"

export async function runSingleWorkflowAction(
  wf: {
    id: string
    agencyId: string
    name: string
    subAgencyId?: string | null
  },
  contact: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    company: string | null
    leadScore: number | null
    emailSuppressed: boolean
    dndEnabled: boolean
    deals?: any[]
  } | null,
  action: {
    id: string
    type: string
    config: string | null
  },
  context: MergeTagContext
): Promise<{ status: "executed" | "skipped" | "failed"; detail: string }> {
  let config: any = {}
  try {
    if (action.config) config = JSON.parse(action.config)
  } catch {}

  if (action.type === "send_email") {
    if (!contact?.email) {
      return { status: "skipped", detail: "Contact missing email address" }
    }
    if (contact.emailSuppressed) {
      return { status: "skipped", detail: "Contact email is suppressed" }
    }

    const rawSubject = config.subject || "Important update from {{agency.name}}"
    const rawBody =
      config.body ||
      "Hi {{contact.firstName | 'there'}}, we have an update regarding your inquiry."
    const personalizedSubject = interpolateMergeTags(rawSubject, context)
    const personalizedBody = interpolateMergeTags(rawBody, context)

    const delivery = await deliverMessage({
      agencyId: wf.agencyId,
      channel: "email",
      contact,
      content: personalizedBody,
      subject: personalizedSubject,
    })

    let conv = await db.conversation.findFirst({
      where: { agencyId: wf.agencyId, contactId: contact.id, channel: "email" },
    })
    if (!conv) {
      conv = await db.conversation.create({
        data: {
          agencyId: wf.agencyId,
          subAgencyId: wf.subAgencyId || null,
          contactId: contact.id,
          channel: "email",
        },
      })
    }

    await db.message
      .create({
        data: {
          conversationId: conv.id,
          isOutbound: true,
          content: `Subject: ${personalizedSubject}\n\n${personalizedBody}`,
          status: delivery.ok ? "delivered" : "failed",
        },
      })
      .catch(() => {})

    await db.conversation
      .update({
        where: { id: conv.id },
        data: { updatedAt: new Date() },
      })
      .catch(() => {})

    return delivery.ok
      ? { status: "executed", detail: `Email sent to ${contact.email}` }
      : { status: "failed", detail: delivery.error || "Email delivery failed" }
  }

  if (action.type === "send_sms") {
    if (!contact?.phone) {
      return { status: "skipped", detail: "Contact missing phone number" }
    }
    if (contact.dndEnabled) {
      return { status: "skipped", detail: "Contact has DND enabled" }
    }

    const rawText =
      config.message ||
      "Hi {{contact.firstName | 'there'}}, this is a quick update from {{agency.name}}!"
    const personalizedMessage = interpolateMergeTags(rawText, context)

    const delivery = await deliverMessage({
      agencyId: wf.agencyId,
      channel: "sms",
      contact,
      content: personalizedMessage,
    })

    let conv = await db.conversation.findFirst({
      where: { agencyId: wf.agencyId, contactId: contact.id, channel: "sms" },
    })
    if (!conv) {
      conv = await db.conversation.create({
        data: {
          agencyId: wf.agencyId,
          subAgencyId: wf.subAgencyId || null,
          contactId: contact.id,
          channel: "sms",
        },
      })
    }

    await db.message
      .create({
        data: {
          conversationId: conv.id,
          isOutbound: true,
          content: personalizedMessage,
          status: delivery.ok ? "delivered" : "failed",
        },
      })
      .catch(() => {})

    await db.conversation
      .update({
        where: { id: conv.id },
        data: { updatedAt: new Date() },
      })
      .catch(() => {})

    return delivery.ok
      ? { status: "executed", detail: `SMS sent to ${contact.phone}` }
      : { status: "failed", detail: delivery.error || "SMS delivery failed" }
  }

  if (action.type === "assign_rep") {
    if (!contact?.id || !config.userId) {
      return { status: "skipped", detail: "Missing contact or assigned userId" }
    }

    const ownedRep = await db.user.findFirst({
      where: { id: String(config.userId), agencyId: wf.agencyId },
      select: { id: true },
    })
    if (!ownedRep) {
      return { status: "failed", detail: "Assigned rep does not belong to agency" }
    }

    await db.contact.updateMany({
      where: { id: contact.id, agencyId: wf.agencyId },
      data: { assignedRepId: ownedRep.id },
    })
    await db.deal.updateMany({
      where: { contactId: contact.id, agencyId: wf.agencyId },
      data: { assignedRepId: ownedRep.id },
    })

    return { status: "executed", detail: `Assigned contact to rep ${ownedRep.id}` }
  }

  if (action.type === "update_deal_stage") {
    if (!contact?.id || !config.stage) {
      return { status: "skipped", detail: "Missing contact or deal stage" }
    }

    await db.deal.updateMany({
      where: { contactId: contact.id, agencyId: wf.agencyId },
      data: { stage: String(config.stage) },
    })

    return { status: "executed", detail: `Updated deal stage to ${config.stage}` }
  }

  if (action.type === "post_webhook") {
    if (!config.webhookUrl) {
      return { status: "skipped", detail: "Missing webhookUrl" }
    }

    const payload = {
      event: "workflow.action",
      workflowId: wf.id,
      workflowName: wf.name,
      contact,
      timestamp: new Date().toISOString(),
    }

    try {
      const safeUrl = assertSafeOutboundUrl(String(config.webhookUrl))
      const res = await fetch(safeUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      })

      await logWebhookDelivery({
        url: safeUrl.toString(),
        event: "workflow.action",
        payload,
        statusCode: res.status,
        agencyId: wf.agencyId,
      }).catch(() => {})

      return res.ok
        ? { status: "executed", detail: `Webhook POST succeeded (${res.status})` }
        : { status: "failed", detail: `Webhook POST returned HTTP ${res.status}` }
    } catch (err: any) {
      await logWebhookDelivery({
        url: String(config.webhookUrl),
        event: "workflow.action",
        payload,
        statusCode: 500,
        error: err?.message || "Webhook dispatch failed",
        agencyId: wf.agencyId,
      }).catch(() => {})

      return { status: "failed", detail: err?.message || "Webhook dispatch failed" }
    }
  }

  if (action.type === "internal_notification") {
    const rawMsg =
      config.message ||
      "Workflow notification: Contact {{contact.fullName | 'Lead'}} progressed in {{custom.workflow.name}}"
    const message = interpolateMergeTags(rawMsg, {
      ...context,
      customValues: {
        ...context.customValues,
        "workflow.name": wf.name,
      },
    })

    await db.notification
      .create({
        data: {
          agencyId: wf.agencyId,
          type: "workflow",
          title: `Workflow: ${wf.name}`,
          body: message.slice(0, 240),
          link: contact?.id ? "/crm/contacts" : "/automations",
        },
      })
      .catch(() => {})

    await pusherServer
      .trigger(`agency-${wf.agencyId}`, "internal-alert", {
        title: `Workflow: ${wf.name}`,
        message,
        contactId: contact?.id,
      })
      .catch(() => {})

    return { status: "executed", detail: "Internal notification dispatched" }
  }

  return { status: "skipped", detail: `Unsupported action type: ${action.type}` }
}

export async function executeWorkflowInternal(
  workflowId: string,
  contactId?: string,
  subAgencyId?: string | null
) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
      include: {
        actions: { orderBy: { order: "asc" } },
        agency: { select: { id: true, name: true, customDomain: true, subdomain: true } },
      },
    })

    if (!workflow) {
      return { success: false, error: "Workflow not found" }
    }

    let targetContactId: string | undefined

    if (contactId) {
      const verifiedContact = await db.contact.findFirst({
        where: { id: contactId, agencyId: workflow.agencyId },
        select: { id: true },
      })
      if (verifiedContact) {
        targetContactId = verifiedContact.id
      }
    } else {
      const effectiveSubAgencyId = subAgencyId !== undefined ? subAgencyId : workflow.subAgencyId
      const fallback = await db.contact.findFirst({
        where: {
          agencyId: workflow.agencyId,
          ...(effectiveSubAgencyId ? { subAgencyId: effectiveSubAgencyId } : {}),
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
      if (fallback) {
        targetContactId = fallback.id
      }
    }

    if (process.env.INNGEST_EVENT_KEY?.trim()) {
      await inngest.send({
        name: "workflow.execute",
        data: {
          workflowId: workflow.id,
          contactId: targetContactId,
        },
      })
      return { success: true, logs: ["Dispatched to Inngest"] }
    }

    const contact = targetContactId
      ? await db.contact.findFirst({
          where: { id: targetContactId, agencyId: workflow.agencyId },
          include: { deals: { take: 1, orderBy: { updatedAt: "desc" } } },
        })
      : null

    const context: MergeTagContext = {
      contact: contact || undefined,
      agency: workflow.agency || undefined,
      deal: contact?.deals?.[0] || undefined,
    }

    const logs: string[] = []
    for (const action of workflow.actions) {
      if (["wait", "wait_delay", "delay", "sleep"].includes(action.type)) {
        logs.push(`[${action.type}] Skipped wait step in synchronous fallback (set INNGEST_EVENT_KEY for async delays)`)
        continue
      }
      const res = await runSingleWorkflowAction(workflow, contact, action, context)
      logs.push(`[${action.type}] ${res.status}: ${res.detail}`)
    }

    return {
      success: true,
      logs: logs.length > 0 ? logs : ["Workflow has no actions configured"],
    }
  } catch (error) {
    console.error("Failed to execute workflow:", error)
    return { success: false, error: "Failed to dispatch workflow" }
  }
}

export async function triggerWorkflowsInternal(
  agencyId: string,
  eventType: string,
  payload?: any,
  subAgencyId?: string | null
) {
  try {
    if (!agencyId) {
      return { success: false, count: 0 }
    }

    const whereClause: any = {
      agencyId,
      status: "active",
      triggers: {
        some: { type: eventType },
      },
    }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    const activeWorkflows = await db.workflow.findMany({
      where: whereClause,
    })

    console.log(`[Workflow Engine] Found ${activeWorkflows.length} active workflows for event: ${eventType}`)

    for (const workflow of activeWorkflows) {
      await executeWorkflowInternal(workflow.id, payload?.contactId, subAgencyId).catch(console.error)
    }

    return { success: true, count: activeWorkflows.length }
  } catch (error) {
    console.error("Failed to trigger workflows:", error)
    return { success: false }
  }
}

export async function triggerFormSubmissionWorkflowInternal(
  agencyId: string,
  formId: string,
  contactId: string,
  formData: any,
  subAgencyId?: string | null
) {
  return triggerWorkflowsInternal(agencyId, "form_submitted", { formId, contactId, formData }, subAgencyId)
}

export async function triggerDealStageChangedWorkflowInternal(
  agencyId: string,
  dealId: string,
  newStage: string,
  contactId?: string,
  subAgencyId?: string | null
) {
  return triggerWorkflowsInternal(agencyId, "deal_stage_changed", { dealId, newStage, contactId }, subAgencyId)
}

export async function triggerReviewReceivedWorkflowInternal(
  agencyId: string,
  rating: number,
  contactId?: string,
  subAgencyId?: string | null
) {
  return triggerWorkflowsInternal(agencyId, "review_received", { rating, contactId }, subAgencyId)
}
