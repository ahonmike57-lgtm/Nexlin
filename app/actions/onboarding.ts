"use server"

import crypto from "crypto"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function completeOnboarding(data: {
  businessName: string
  industry: string
  timezone: string
  primaryColor?: string
}) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id
    const businessName = data.businessName?.trim()
    if (!businessName) {
      return { success: false, error: "Business name is required" }
    }

    const cleanPrimaryColor =
      typeof data.primaryColor === "string" && /^#[0-9a-fA-F]{3,8}$/.test(data.primaryColor.trim())
        ? data.primaryColor.trim()
        : undefined

    const existingUser = await db.user.findUnique({
      where: { id: userId },
      include: { agency: true },
    })

    if (existingUser?.agency) {
      const roleStr = (existingUser.role || "").toLowerCase()
      if (!roleStr.includes("owner") && !roleStr.includes("admin")) {
        return {
          success: false,
          error: "Forbidden: Only an agency admin can update workspace onboarding settings.",
        }
      }

      let existingBrandMeta: Record<string, any> = {}
      if (existingUser.agency.brandColors) {
        try {
          existingBrandMeta = JSON.parse(existingUser.agency.brandColors)
        } catch {}
      }

      await db.agency.update({
        where: { id: existingUser.agency.id },
        data: {
          name: businessName,
          whiteLabelName: businessName,
          brandColors: JSON.stringify({
            ...existingBrandMeta,
            timezone: data.timezone,
            industry: data.industry,
            ...(cleanPrimaryColor ? { primary: cleanPrimaryColor } : {}),
          }),
        },
      })

      return { success: true }
    }

    let platform = await db.platform.findFirst()
    if (!platform) {
      platform = await db.platform.create({
        data: { name: "NEXLIN GHL" },
      })
    }

    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "") || "agency"
    const suffix = crypto.randomBytes(3).toString("hex")

    // 1. Create the new Agency with collision-safe subdomain
    const agency = await db.agency.create({
      data: {
        platformId: platform.id,
        name: businessName,
        whiteLabelName: businessName,
        subdomain: `${slug}-${suffix}`,
        brandColors: JSON.stringify({
          timezone: data.timezone,
          industry: data.industry,
          ...(cleanPrimaryColor ? { primary: cleanPrimaryColor } : {}),
        }),
      },
    })

    // 2. Create the first default SubAgency (workspace)
    await db.subAgency.create({
      data: {
        agencyId: agency.id,
        name: `${businessName} (Main Workspace)`,
        email: session.user.email || "",
      },
    })

    // 3. Update the User to be an Agency Owner
    await db.user.update({
      where: { id: userId },
      data: {
        agencyId: agency.id,
        role: "Agency Owner",
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error completing onboarding:", error)
    return { success: false, error: "Failed to setup agency environment" }
  }
}
