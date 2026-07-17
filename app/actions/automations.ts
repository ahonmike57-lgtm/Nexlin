"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { getActiveSubAccountId } from "./subaccounts"

export async function getWorkflows(agencyId: string) {
  try {
    const subAgencyId = await getActiveSubAccountId()
    
    const whereClause: any = { agencyId }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    const workflows = await db.workflow.findMany({
      where: whereClause,
      include: {
        triggers: true,
        actions: { orderBy: { order: "asc" } }
      },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, data: workflows }
  } catch (error) {
    console.error("Failed to fetch workflows:", error)
    return { success: false, error: "Failed to fetch workflows" }
  }
}

export async function createWorkflow(agencyId: string, name: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

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
    return { success: true, data: workflow }
  } catch (error) {
    console.error("Failed to create workflow:", error)
    return { success: false, error: "Failed to create workflow" }
  }
}

export async function getWorkflow(id: string) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id },
      include: {
        triggers: true,
        actions: { orderBy: { order: "asc" } }
      }
    })
    return { success: true, data: workflow }
  } catch (error) {
    console.error("Failed to fetch workflow:", error)
    return { success: false, error: "Failed to fetch workflow" }
  }
}

export async function addWorkflowTrigger(workflowId: string, type: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const trigger = await db.workflowTrigger.create({
      data: { workflowId, type }
    })
    revalidatePath(`/automations/${workflowId}`)
    return { success: true, data: trigger }
  } catch (error) {
    console.error("Failed to add trigger:", error)
    return { success: false, error: "Failed to add trigger" }
  }
}

export async function addWorkflowAction(workflowId: string, type: string, order: number) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const action = await db.workflowAction.create({
      data: { workflowId, type, order }
    })
    revalidatePath(`/automations/${workflowId}`)
    return { success: true, data: action }
  } catch (error) {
    console.error("Failed to add action:", error)
    return { success: false, error: "Failed to add action" }
  }
}

export async function deleteWorkflowTrigger(id: string, workflowId: string) {
  try {
    await db.workflowTrigger.delete({ where: { id } })
    revalidatePath(`/automations/${workflowId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete trigger" }
  }
}

export async function deleteWorkflowAction(id: string, workflowId: string) {
  try {
    await db.workflowAction.delete({ where: { id } })
    revalidatePath(`/automations/${workflowId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete action" }
  }
}

export async function updateWorkflowStatus(id: string, status: "draft" | "active") {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const workflow = await db.workflow.update({
      where: { id },
      data: { status }
    })
    
    revalidatePath(`/automations/${id}`)
    revalidatePath("/automations")
    return { success: true, data: workflow }
  } catch (error) {
    console.error("Failed to update status:", error)
    return { success: false, error: "Failed to update status" }
  }
}

export async function updateWorkflow(id: string, data: { name?: string; description?: string }) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const workflow = await db.workflow.update({
      where: { id },
      data,
    })

    revalidatePath(`/automations/${id}`)
    revalidatePath("/automations")
    return { success: true, data: workflow }
  } catch (error) {
    console.error("Failed to update workflow:", error)
    return { success: false, error: "Failed to update workflow" }
  }
}

export async function saveWorkflowNodes(workflowId: string, nodes: { id: string, isTrigger: boolean, config: any }[]) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Update triggers and actions configs
    await db.$transaction(
      nodes.map(node => {
        if (node.isTrigger) {
          return db.workflowTrigger.update({
            where: { id: node.id },
            data: { config: JSON.stringify(node.config) }
          })
        } else {
          return db.workflowAction.update({
            where: { id: node.id },
            data: { config: JSON.stringify(node.config) }
          })
        }
      })
    )
    
    revalidatePath(`/automations/${workflowId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to save nodes:", error)
    return { success: false, error: "Failed to save workflow nodes" }
  }
}
