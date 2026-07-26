"use server"

import { db } from "@/lib/db"
import { requirePlatformAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function createMarketplaceApp(data: {
  name: string
  description: string
  category: string
  icon?: string
  author?: string
  websiteUrl?: string
}) {
  try {
    const auth = await requirePlatformAuth(["owner", "developer"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    if (!data.name.trim() || !data.description.trim()) {
      return { success: false, error: "App name and description are required." }
    }

    const slug = data.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-")

    const existing = await db.app.findUnique({
      where: { slug }
    })

    if (existing) {
      return { success: false, error: "An app with this name already exists." }
    }

    const app = await db.app.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description.trim(),
        category: data.category || "General",
        icon: data.icon || null,
        author: data.author || "Platform Certified Developer",
        isFeatured: false,
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

export async function toggleAppFeaturedStatus(appId: string, isFeatured: boolean) {
  try {
    const auth = await requirePlatformAuth(["owner", "developer"])
    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    await db.app.update({
      where: { id: appId },
      data: { isFeatured }
    })

    revalidatePath("/platform/apps")
    revalidatePath("/marketplace")
    return { success: true }
  } catch (error: any) {
    console.error("Toggle app featured error:", error)
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
