"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { executeWorkflowInternal, triggerWorkflowsInternal } from "@/lib/workflow-engine"
import { getActiveSubAccountId } from "./subaccounts"

export async function executeWorkflow(workflowId: string, contactId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const workflow = await db.workflow.findFirst({
      where: { id: workflowId, agencyId: auth.agencyId },
      select: { id: true },
    })

    if (!workflow) {
      return { success: false, error: "Workflow not found" }
    }

    const subAgencyId = await getActiveSubAccountId()
    return await executeWorkflowInternal(workflow.id, contactId, subAgencyId)
  } catch (error) {
    console.error("Failed to execute workflow:", error)
    return { success: false, error: "Failed to dispatch workflow" }
  }
}

export async function triggerWorkflows(_agencyId: string, eventType: string, payload?: any) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  const subAgencyId = await getActiveSubAccountId()
  return await triggerWorkflowsInternal(auth.agencyId, eventType, payload, subAgencyId)
}

/**
 * Native Trigger Handlers for Event Events
 */
export async function triggerFormSubmissionWorkflow(agencyId: string, formId: string, contactId: string, formData: any) {
  return triggerWorkflows(agencyId, "form_submitted", { formId, contactId, formData })
}

export async function triggerDealStageChangedWorkflow(agencyId: string, dealId: string, newStage: string, contactId?: string) {
  return triggerWorkflows(agencyId, "deal_stage_changed", { dealId, newStage, contactId })
}

export async function triggerReviewReceivedWorkflow(agencyId: string, rating: number, contactId?: string) {
  return triggerWorkflows(agencyId, "review_received", { rating, contactId })
}
