"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

export async function getWorkflows(agencyId: string) {
  try {
    const workflows = await db.workflow.findMany({
      where: { agencyId },
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

    const workflow = await db.workflow.create({
      data: {
        agencyId,
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
