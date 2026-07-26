"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"

export async function checkAndAutoTopUpWallet(threshold = 10, autoTopUpAmount = 50) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const wallet = await db.billingWallet.findUnique({
      where: { agencyId: auth.agencyId }
    })

    if (!wallet) return { success: false, error: "Billing wallet not found" }

    if (wallet.balance < threshold) {
      // Simulate automatic Stripe charge & wallet top up
      const updated = await db.billingWallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance + autoTopUpAmount }
      })

      return { success: true, toppedUp: true, newBalance: updated.balance }
    }

    return { success: true, toppedUp: false, balance: wallet.balance }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
