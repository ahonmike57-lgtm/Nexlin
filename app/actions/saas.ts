"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

const DEFAULT_MARKUPS = [
  { type: "sms", multiplier: 1.5, baseCost: 0.015 },
  { type: "email", multiplier: 1.2, baseCost: 0.001 },
  { type: "ai_tokens", multiplier: 3.0, baseCost: 0.005 }, // per 1k tokens
  { type: "call_minutes", multiplier: 2.0, baseCost: 0.025 }
]

export async function getRebillingMarkups(agencyId: string) {
  try {
    const markups = await db.rebillingMarkup.findMany({
      where: { agencyId }
    })
    
    // Merge DB markups with defaults to ensure all types exist in the UI
    const merged = DEFAULT_MARKUPS.map(def => {
      const existing = markups.find(m => m.type === def.type)
      return {
        id: existing?.id,
        type: def.type,
        multiplier: existing ? existing.multiplier : def.multiplier,
        baseCost: def.baseCost // Base cost is static for calculation purposes
      }
    })

    return { success: true, markups: merged }
  } catch (error) {
    console.error("Error fetching rebilling markups:", error)
    return { success: false, error: "Failed to fetch markups" }
  }
}

export async function saveRebillingMarkup(agencyId: string, type: string, multiplier: number) {
  try {
    const markup = await db.rebillingMarkup.upsert({
      where: { agencyId_type: { agencyId, type } },
      update: { multiplier },
      create: { agencyId, type, multiplier }
    })
    revalidatePath("/settings/saas")
    return { success: true, markup }
  } catch (error) {
    console.error("Error saving markup:", error)
    return { success: false, error: "Failed to save markup" }
  }
}

export async function getAgencyWalletBalance(agencyId: string) {
  try {
    let wallet = await db.billingWallet.findUnique({
      where: { agencyId }
    })
    
    if (!wallet) {
      wallet = await db.billingWallet.create({
        data: { agencyId, balance: 0.0 }
      })
    }
    
    return { success: true, wallet }
  } catch (error) {
    console.error("Error fetching wallet balance:", error)
    return { success: false, error: "Failed to fetch wallet balance" }
  }
}
