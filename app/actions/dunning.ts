"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { sendSMS } from "@/app/actions/telephony"

export async function processDunningEvent(agencyId: string, subscriptionId: string, status: "payment_failed" | "past_due" | "canceled") {
  try {
    // 1. Update agency SaaS status
    await db.agency.update({
      where: { id: agencyId },
      data: {
        status: status === "payment_failed" ? "past_due" : status
      }
    })

    // 2. Trigger automated SMS alert to agency admin
    const owner = await db.user.findFirst({
      where: { agencyId, role: "Agency Owner" }
    })

    if (owner?.id) {
      await sendSMS(owner.id, "Alert: Your subscription payment failed. Please update your payment method in Settings -> Billing to maintain service.")
    }

    return { success: true }
  } catch (error: any) {
    console.error("Dunning processing error:", error)
    return { success: false, error: error.message }
  }
}
