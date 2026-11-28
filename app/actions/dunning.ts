"use server"

import { db } from "@/lib/db"
import { deliverMessage } from "@/lib/messaging"
import { requirePlatformAuth } from "@/lib/permissions"

export async function processDunningEvent(
  agencyId: string,
  subscriptionId: string,
  status: "payment_failed" | "past_due" | "canceled"
) {
  const auth = await requirePlatformAuth(["owner"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  try {
    const nextStatus = status === "payment_failed" ? "past_due" : status

    // 1. Update agency SaaS status
    await db.agency.update({
      where: { id: agencyId },
      data: { status: nextStatus },
    })

    const alertMessage =
      status === "canceled"
        ? `Subscription ${subscriptionId} was canceled. Please renew in Settings -> Billing to restore full access.`
        : "Alert: Your subscription payment failed. Please update your payment method in Settings -> Billing to maintain service."

    // 2. Create in-app notification for the agency
    await db.notification
      .create({
        data: {
          agencyId,
          type: "system",
          title: status === "canceled" ? "Subscription Canceled" : "Subscription Payment Failed",
          body: alertMessage,
          link: "/settings/billing",
        },
      })
      .catch(() => {})

    // 3. Notify the Agency Owner via email (non-fatal if email provider isn't configured)
    const owner = await db.user.findFirst({
      where: { agencyId, role: "Agency Owner" },
      select: { email: true },
    })

    if (owner?.email) {
      await deliverMessage({
        agencyId,
        channel: "email",
        contact: { email: owner.email },
        subject: "Subscription Payment Alert",
        content: alertMessage,
      }).catch(() => {})
    }

    return { success: true }
  } catch (error: any) {
    console.error("Dunning processing error:", error)
    return { success: false, error: error.message || "Failed to process dunning event" }
  }
}
