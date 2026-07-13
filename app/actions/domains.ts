"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function updateFunnelDomain(funnelId: string, customDomain: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Ideally we would verify the agency owns this funnel first
    const updatedFunnel = await db.funnel.update({
      where: { id: funnelId },
      data: { customDomain }
    })

    revalidatePath("/settings/domains")
    revalidatePath("/funnels")
    return { success: true, data: updatedFunnel }
  } catch (error) {
    console.error("Failed to update domain:", error)
    return { success: false, error: "Failed to update domain" }
  }
}
