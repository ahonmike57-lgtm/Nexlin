"use server"

import { db } from "@/lib/db"
import { requirePlatformAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function createMarketplaceApp(data: {
  name: string
  description: string
  category: string
  icon?: string
  installType?: string
  tagline?: string
}) {
  try {
    const auth = await requirePlatformAuth(["owner", "developer"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    if (!data.name.trim() || !data.description.trim()) {
      return { success: false, error: "App name and description are required." }
    }

    const id = data.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-")

    const existing = await db.app.findUnique({
      where: { id }
    })

    if (existing) {
      return { success: false, error: "An app with this ID/slug already exists." }
    }

    const app = await db.app.create({
      data: {
        id,
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category || "General",
        installType: data.installType || "oauth",
        tagline: data.tagline || data.description.trim().slice(0, 80),
        icon: data.icon || null,
        isActive: true,
      }
    })

    revalidatePath("/platform/apps")
    revalidatePath("/marketplace")
    return { success: true, app }
  } catch (error: any) {
    console.error("Create marketplace app error:", error)
    return { success: false, error: error.message || "Failed to create app" }
  }
}

export async function toggleAppActiveStatus(appId: string, isActive: boolean) {
  try {
    const auth = await requirePlatformAuth(["owner", "developer"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    await db.app.update({
      where: { id: appId },
      data: { isActive }
    })

    revalidatePath("/platform/apps")
    revalidatePath("/marketplace")
    return { success: true }
  } catch (error: any) {
    console.error("Toggle app active status error:", error)
    return { success: false, error: "Failed to toggle status" }
  }
}

export async function deleteMarketplaceApp(appId: string) {
  try {
    const auth = await requirePlatformAuth(["owner"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    await db.app.delete({
      where: { id: appId }
    })

    revalidatePath("/platform/apps")
    revalidatePath("/marketplace")
    return { success: true }
  } catch (error: any) {
    console.error("Delete app error:", error)
    return { success: false, error: "Failed to delete app" }
  }
}
