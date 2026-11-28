import "server-only"
import { db } from "@/lib/db"

export const DEFAULT_MARKUPS = [
  { type: "sms", multiplier: 1.5, baseCost: 0.015 },
  { type: "email", multiplier: 1.2, baseCost: 0.001 },
  { type: "ai_tokens", multiplier: 3.0, baseCost: 0.005 }, // per 1k tokens
  { type: "call_minutes", multiplier: 2.0, baseCost: 0.025 },
]

/**
 * Server-only usage deduction helper. Never expose directly as a `"use server"`
 * action, because clients could pass arbitrary negative or inflated amounts.
 */
export async function deductUsage(
  agencyId: string,
  subAgencyId: string | null,
  type: string,
  amount: number
) {
  try {
    if (!agencyId) {
      return { success: false, error: "Agency ID is required" }
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Usage amount must be a positive number" }
    }

    const baseCostDef = DEFAULT_MARKUPS.find((m) => m.type === type)
    if (!baseCostDef) {
      return { success: false, error: "Invalid usage type" }
    }

    let baseCost = baseCostDef.baseCost * amount
    if (type === "ai_tokens") {
      baseCost = baseCostDef.baseCost * (amount / 1000)
    }

    const markupObj = await db.rebillingMarkup.findUnique({
      where: { agencyId_type: { agencyId, type } },
    })
    const multiplier =
      markupObj && Number.isFinite(markupObj.multiplier) && markupObj.multiplier > 0
        ? markupObj.multiplier
        : baseCostDef.multiplier

    const costToClient = baseCost * multiplier

    const walletQuery = subAgencyId ? { subAgencyId } : { agencyId }
    let wallet = await db.billingWallet.findUnique({
      where: walletQuery as any,
    })

    if (!wallet) {
      wallet = await db.billingWallet.create({
        data: {
          agencyId: subAgencyId ? undefined : agencyId,
          subAgencyId: subAgencyId || undefined,
          balance: 0.0,
        },
      })
    }

    const updatedWallet = await db.billingWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: costToClient } },
    })

    await db.usageLog.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        cost: baseCost,
        markup: costToClient,
      },
    })

    return { success: true, wallet: updatedWallet }
  } catch (error) {
    console.error("Error deducting usage:", error)
    return { success: false, error: "Failed to deduct usage" }
  }
}
