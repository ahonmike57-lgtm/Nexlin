"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getCustomMenuItems() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const items = await db.snapshot.findMany({
      where: { agencyId: auth.agencyId, version: "custom_menu" },
      orderBy: { createdAt: "asc" }
    })

    return { success: true, items: items.map(i => ({ id: i.id, name: i.name, ...(i.description ? JSON.parse(i.description) : {}) })) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createCustomMenuItem(label: string, iframeUrl: string, iconName?: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const item = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
        name: label.trim(),
        version: "custom_menu",
        description: JSON.stringify({ iframeUrl: iframeUrl.trim(), iconName: iconName || "Globe" })
      }
    })

    revalidatePath("/dashboard")
    return { success: true, item }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
