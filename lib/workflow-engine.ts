import { db } from "@/lib/db"
import { inngest } from "@/lib/inngest/client"

export async function executeWorkflowInternal(
  workflowId: string,
  contactId?: string,
  subAgencyId?: string | null
) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
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

    await inngest.send({
      name: "workflow.execute",
      data: {
        workflowId: workflow.id,
        contactId: targetContactId,
      },
    })

    return { success: true, logs: ["Dispatched to Inngest"] }
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
