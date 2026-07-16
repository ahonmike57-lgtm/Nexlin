"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { getActiveSubAccountId } from "./subaccounts"

export async function getFunnels(agencyId: string) {
  try {
    const subAgencyId = await getActiveSubAccountId()
    const whereClause: any = { agencyId }
    if (subAgencyId) {
      whereClause.subAgencyId = subAgencyId
    }

    const funnels = await db.funnel.findMany({
      where: whereClause,
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

    const subAgencyId = await getActiveSubAccountId()

    const funnel = await db.funnel.create({
      data: {
        agencyId,
        subAgencyId,
        name,
        subdomain: name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
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

export async function getLiveFunnelStep(subdomain: string, slug: string) {
  try {
    // Treat "home" or undefined slug as "/"
    const pathToMatch = !slug || slug === 'home' ? '/' : `/${slug}`
    
    const funnel = await db.funnel.findUnique({
      where: { subdomain },
      include: {
        steps: {
          where: { path: pathToMatch }
        }
      }
    })

    if (!funnel || funnel.steps.length === 0) {
      return { success: false, error: "Not found" }
    }

    return { success: true, data: { funnel, step: funnel.steps[0] } }
  } catch (error) {
    console.error("Failed to fetch live funnel:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function submitLiveFunnelForm(subdomain: string, formData: any) {
  try {
    const funnel = await db.funnel.findUnique({
      where: { subdomain },
      select: { agencyId: true, subAgencyId: true }
    })

    if (!funnel) return { success: false, error: "Funnel not found" }

    // 1. Create a contact
    const contact = await db.contact.create({
      data: {
        agencyId: funnel.agencyId,
        subAgencyId: funnel.subAgencyId,
        firstName: formData.name || "Unknown",
        email: formData.email || "",
        phone: formData.phone || ""
      }
    })

    // 2. We could trigger the workflow engine here for "contact_created" trigger
    // await executeWorkflow(...)

    return { success: true, data: contact }
  } catch (error) {
    console.error("Form submission failed:", error)
    return { success: false, error: "Submission failed" }
  }
}
