"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function createTriggerLink(name: string, targetUrl: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const link = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
        name: name.trim(),
        version: "trigger_link",
        description: JSON.stringify({ targetUrl: targetUrl.trim(), clickCount: 0 })
      }
    })

    revalidatePath("/automations")
    return { success: true, link }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getTriggerLinks() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const links = await db.snapshot.findMany({
      where: { agencyId: auth.agencyId, version: "trigger_link" },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, links }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
