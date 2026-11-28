"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"

export async function syncXeroInvoice(
  _invoiceNumber: string,
  _amount: number,
  _customerEmail: string
) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const xeroInstall = await db.tenantApp.findFirst({
      where: {
        agencyId: auth.agencyId,
        status: "active",
        app: {
          OR: [
            { id: "xero" },
            { name: { contains: "Xero", mode: "insensitive" } },
          ],
        },
      },
      include: { app: true },
    })

    if (!xeroInstall) {
      return {
        success: false,
        error:
          "Xero is not connected for this agency. Install and authorize Xero in Marketplace -> Apps first.",
      }
    }

    return {
      success: false,
      error:
        "Xero invoice sync requires completing Xero OAuth2 tenant authorization in Integrations.",
    }
  } catch (error: any) {
    return { success: false, error: error?.message || "Xero sync failed" }
  }
}
