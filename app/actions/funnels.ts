"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { getActiveSubAccountId } from "./subaccounts"

export const getFunnels = withAgency(async ({ db }) => {
  const subAgencyId = await getActiveSubAccountId()
  const whereClause: any = {}
  if (subAgencyId) {
    whereClause.subAgencyId = subAgencyId
  }

  return db.funnel.findMany({
    where: whereClause,
    include: {
      steps: true
    },
    orderBy: { createdAt: "desc" }
  })
})

export const createFunnel = withAgency(
  async ({ db, agencyId }, name: string) => {
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
    return funnel
  }
)

export const getFunnel = withAgency(
  async ({ db }, funnelId: string) => {
    const funnel = await db.funnel.findFirst({
      where: { id: funnelId },
      include: { steps: { orderBy: { order: "asc" } } }
    })
    if (!funnel) throw new Error("Funnel not found")
    return funnel
  }
)

export const updateFunnelStepContent = withAgency(
  async ({ db }, stepId: string, content: string) => {
    const step = await db.funnelStep.updateMany({
      where: { id: stepId },
      data: { content }
    })

    return { id: stepId, updated: step.count > 0 }
  }
)

export async function getLiveFunnelStep(subdomain: string, slug: string) {
  try {
    const { db } = await import("@/lib/db")
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
    const { db } = await import("@/lib/db")
    const funnel = await db.funnel.findUnique({
      where: { subdomain },
      select: { agencyId: true, subAgencyId: true }
    })

    if (!funnel) return { success: false, error: "Funnel not found" }

    const contact = await db.contact.create({
      data: {
        agencyId: funnel.agencyId,
        subAgencyId: funnel.subAgencyId,
        firstName: formData.name || "Unknown",
        email: formData.email || "",
        phone: formData.phone || ""
      }
    })

    return { success: true, data: contact }
  } catch (error) {
    console.error("Form submission failed:", error)
    return { success: false, error: "Submission failed" }
  }
}

export const publishVibecodeToFunnel = withAgency(
  async ({ db, agencyId }, data: { name: string; htmlContent: string }) => {
    const subAgencyId = await getActiveSubAccountId()
    const cleanSubdomain = (data.name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "page") + "-" + Math.floor(100 + Math.random() * 900)

    const funnel = await db.funnel.create({
      data: {
        agencyId,
        subAgencyId,
        name: data.name.trim() || "Vibecode Landing Page",
        subdomain: cleanSubdomain,
        status: "active",
        steps: {
          create: [
            {
              name: "Landing Page",
              path: "/",
              order: 0,
              content: data.htmlContent,
            }
          ]
        }
      }
    })

    revalidatePath("/funnels")
    revalidatePath("/forge/vibecode")
    return {
      success: true,
      funnelId: funnel.id,
      subdomain: funnel.subdomain,
      liveUrl: `/f/${funnel.subdomain}`
    }
  }
)

