"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function completeOnboarding(data: {
  businessName: string
  industry: string
  timezone: string
}) {
  try {
    const session = await getSession()
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    let platform = await db.platform.findFirst()
    if (!platform) {
      platform = await db.platform.create({
        data: { name: "NEXLIN GHL" }
      })
    }

    // 1. Create the new Agency
    const agency = await db.agency.create({
      data: {
        platformId: platform.id,
        name: data.businessName,
        whiteLabelName: data.businessName,
        subdomain: `${data.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      }
    })

    // 2. Create the first default SubAgency (workspace)
    await db.subAgency.create({
      data: {
        agencyId: agency.id,
        name: `${data.businessName} (Main Workspace)`,
        email: session.user.email || "",
      }
    })

    // 3. Update the User to be an Agency Owner
    await db.user.update({
      where: { id: userId },
      data: {
        agencyId: agency.id,
        role: "AGENCY_OWNER"
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error completing onboarding:", error)
    return { success: false, error: "Failed to setup agency environment" }
  }
}
