"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

export async function getFunnels(agencyId: string) {
  try {
    const funnels = await db.funnel.findMany({
      where: { agencyId },
      include: {
        steps: true
      },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, data: funnels }
  } catch (error) {
    console.error("Failed to fetch funnels:", error)
    return { success: false, error: "Failed to fetch funnels" }
  }
}

export async function createFunnel(agencyId: string, name: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const funnel = await db.funnel.create({
      data: {
        agencyId,
        name,
        status: "Draft",
        steps: {
          create: [
            { name: "Landing Page", path: "/", order: 0 }
          ]
        }
      }
    })

    revalidatePath("/funnels")
    return { success: true, data: funnel }
  } catch (error) {
    console.error("Failed to create funnel:", error)
    return { success: false, error: "Failed to create funnel" }
  }
}

export async function getFunnel(funnelId: string) {
  try {
    const funnel = await db.funnel.findUnique({
      where: { id: funnelId },
      include: { steps: { orderBy: { order: "asc" } } }
    })
    return { success: true, data: funnel }
  } catch (error) {
    console.error("Failed to fetch funnel:", error)
    return { success: false, error: "Failed to fetch funnel" }
  }
}

export async function updateFunnelStepContent(stepId: string, content: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const step = await db.funnelStep.update({
      where: { id: stepId },
      data: { content }
    })

    return { success: true, data: step }
  } catch (error) {
    console.error("Failed to update step content:", error)
    return { success: false, error: "Failed to update step" }
  }
}
