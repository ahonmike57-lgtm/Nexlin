"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function syncXeroInvoice(invoiceNumber: string, amount: number, customerEmail: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const syncLog = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
        name: `Xero Sync - #${invoiceNumber}`,
        version: "xero_ledger",
        description: JSON.stringify({
          invoiceNumber,
          amount,
          customerEmail,
          status: "synced",
          syncedAt: new Date().toISOString()
        })
      }
    })

    revalidatePath("/settings/billing")
    return { success: true, syncLog }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
