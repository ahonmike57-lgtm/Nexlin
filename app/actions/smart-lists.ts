"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getSmartLists() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const lists = await db.snapshot.findMany({
      where: { agencyId: auth.agencyId, version: "smart_list" },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, lists }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createSmartList(name: string, filters: { tags?: string[]; minScore?: number; search?: string }) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const list = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
        name: name.trim(),
        version: "smart_list",
        description: JSON.stringify(filters)
      }
    })

    revalidatePath("/crm/contacts")
    return { success: true, list }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteSmartList(id: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    await db.snapshot.deleteMany({
      where: { id, agencyId: auth.agencyId, version: "smart_list" }
    })

    revalidatePath("/crm/contacts")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
