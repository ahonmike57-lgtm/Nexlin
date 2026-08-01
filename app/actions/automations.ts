"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { getActiveSubAccountId } from "./subaccounts"
import { generateAiReply } from "./ai"

export const getWorkflows = withAgency(async ({ db }) => {
  const subAgencyId = await getActiveSubAccountId()
  const whereClause: any = {}
  if (subAgencyId) {
    whereClause.subAgencyId = subAgencyId
  }

  return db.workflow.findMany({
    where: whereClause,
    include: {
      triggers: true,
      actions: { orderBy: { order: "asc" } }
    },
    orderBy: { createdAt: "desc" }
  })
})

export const createWorkflow = withAgency(
  async ({ db, agencyId }, name: string) => {
    const subAgencyId = await getActiveSubAccountId()

    const workflow = await db.workflow.create({
      data: {
        agencyId,
        subAgencyId,
        name,
        status: "draft",
        triggers: {
          create: [{ type: "contact_created" }]
        },
        actions: {
          create: [{ type: "send_email", order: 0 }]
        }
      }
    })

    revalidatePath("/automations")
    return workflow
  }
)

export const getWorkflow = withAgency(
  async ({ db }, id: string) => {
    const workflow = await db.workflow.findFirst({
      where: { id },
      include: {
        triggers: true,
        actions: { orderBy: { order: "asc" } }
      }
    })
    if (!workflow) throw new Error("Workflow not found")
    return workflow
  }
)

export const addWorkflowTrigger = withAgency(
  async ({ db }, workflowId: string, type: string) => {
    const trigger = await db.workflowTrigger.create({
      data: { workflowId, type }
    })
    revalidatePath(`/automations/${workflowId}`)
    return trigger
  }
)

export const addWorkflowAction = withAgency(
  async ({ db }, workflowId: string, type: string, order: number) => {
    const action = await db.workflowAction.create({
      data: { workflowId, type, order }
    })
    revalidatePath(`/automations/${workflowId}`)
    return action
  }
)

export const deleteWorkflowTrigger = withAgency(
  async ({ db }, id: string, workflowId: string) => {
    await db.workflowTrigger.deleteMany({ where: { id, workflowId } })
    revalidatePath(`/automations/${workflowId}`)
    return { id }
  }
)

export const deleteWorkflowAction = withAgency(
  async ({ db }, id: string, workflowId: string) => {
    await db.workflowAction.deleteMany({ where: { id, workflowId } })
    revalidatePath(`/automations/${workflowId}`)
    return { id }
  }
)

export const updateWorkflowStatus = withAgency(
  async ({ db }, id: string, status: "draft" | "active") => {
    const workflow = await db.workflow.updateMany({
      where: { id },
      data: { status }
    })

    if (workflow.count === 0) throw new Error("Workflow not found")

    revalidatePath(`/automations/${id}`)
    revalidatePath("/automations")
    return { id, status }
  },
  { role: "admin" }
)

export const updateWorkflow = withAgency(
  async ({ db }, id: string, data: { name?: string; description?: string }) => {
    const workflow = await db.workflow.updateMany({
      where: { id },
      data,
    })

    if (workflow.count === 0) throw new Error("Workflow not found")

    revalidatePath(`/automations/${id}`)
    revalidatePath("/automations")
    return { id }
  },
  { role: "admin" }
)

export const saveWorkflowNodes = withAgency(
  async ({ db }, workflowId: string, nodes: { id: string, isTrigger: boolean, config: any }[]) => {
    await db.$transaction(
      nodes.map(node => {
        if (node.isTrigger) {
          return db.workflowTrigger.updateMany({
            where: { id: node.id, workflowId },
            data: { config: JSON.stringify(node.config) }
          })
        } else {
          return db.workflowAction.updateMany({
            where: { id: node.id, workflowId },
            data: { config: JSON.stringify(node.config) }
          })
        }
      })
    )

    revalidatePath(`/automations/${workflowId}`)
    return { id: workflowId }
  },
  { role: "admin" }
)

export const generateWorkflowFromPrompt = withAgency(
  async ({ db, agencyId }, prompt: string) => {
    const aiRes = await generateAiReply("workflow_generator", prompt)
    if (!aiRes.success || !aiRes.data) {
      throw new Error(aiRes.error || "Failed to generate workflow via AI")
    }

    let parsed
    try {
      const rawJson = aiRes.data.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(rawJson)
    } catch (e) {
      console.error("Failed to parse workflow JSON:", aiRes.data)
      throw new Error("AI returned invalid workflow structure")
    }

    const subAgencyId = await getActiveSubAccountId()
    const triggerType = parsed.trigger || "contact_created"
    const actionsList = Array.isArray(parsed.actions) ? parsed.actions : [{ type: "send_email" }]

    const mappedActions = actionsList.map((a: any, index: number) => ({
      type: a.type || "wait",
      order: index
    }))

    const workflow = await db.workflow.create({
      data: {
        agencyId,
        subAgencyId,
        name: parsed.name || "AI Generated Workflow",
        status: "draft",
        triggers: {
          create: [{ type: triggerType }]
        },
        actions: {
          create: mappedActions
        }
      }
    })

    revalidatePath("/automations")
    return workflow
  }
)
