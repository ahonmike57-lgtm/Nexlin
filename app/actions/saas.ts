"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireTenantAuth } from "@/lib/permissions"
import { DEFAULT_MARKUPS } from "@/lib/usage"

export async function getRebillingMarkups(agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }
  const scopedAgencyId = auth.agencyId

  try {
    const markups = await db.rebillingMarkup.findMany({
      where: { agencyId: scopedAgencyId }
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
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }
  const scopedAgencyId = auth.agencyId

  try {
    const markup = await db.rebillingMarkup.upsert({
      where: { agencyId_type: { agencyId: scopedAgencyId, type } },
      update: { multiplier },
      create: { agencyId: scopedAgencyId, type, multiplier }
    })
    revalidatePath("/settings/saas")
    return { success: true, markup }
  } catch (error) {
    console.error("Error saving markup:", error)
    return { success: false, error: "Failed to save markup" }
  }
}

export async function getAgencyWalletBalance(agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }
  const scopedAgencyId = auth.agencyId

  try {
    let wallet = await db.billingWallet.findUnique({
      where: { agencyId: scopedAgencyId }
    })
    
    if (!wallet) {
      wallet = await db.billingWallet.create({
        data: { agencyId: scopedAgencyId, balance: 0.0 }
      })
    }
    
    return { success: true, wallet }
  } catch (error) {
    console.error("Error fetching wallet balance:", error)
    return { success: false, error: "Failed to fetch wallet balance" }
  }
}

