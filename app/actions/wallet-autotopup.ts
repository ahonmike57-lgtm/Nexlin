"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"

export async function checkAndAutoTopUpWallet(threshold = 10, _autoTopUpAmount = 50) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  if (!Number.isFinite(threshold) || threshold <= 0) {
    return { success: false, error: "Threshold must be a positive number" }
  }

  try {
    const wallet = await db.billingWallet.findUnique({
      where: { agencyId: auth.agencyId }
    })

    if (!wallet) return { success: false, error: "Billing wallet not found" }

    if (wallet.balance < threshold) {
      return {
        success: false,
        toppedUp: false,
        requiresPaymentMethod: true,
        balance: wallet.balance,
        error: "Automatic wallet top-up requires a verified off-session payment confirmation and cannot credit balance directly."
      }
    }

    return { success: true, toppedUp: false, balance: wallet.balance }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
