"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getBlogPosts() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const posts = await db.snapshot.findMany({
      where: { agencyId: auth.agencyId, version: "blog_post" },
      orderBy: { createdAt: "desc" }
    })

    const parsed = posts.map(p => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      ...(p.description ? JSON.parse(p.description) : {})
    }))

    return { success: true, posts: parsed }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createBlogPost(data: {
  title: string
  slug: string
  summary: string
  content: string
  author: string
  category: string
  coverImage?: string
  status: "draft" | "published"
}) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const post = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
        name: data.title.trim(),
        version: "blog_post",
        description: JSON.stringify({
          slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          summary: data.summary,
          content: data.content,
          author: data.author,
          blogCategory: data.category,
          coverImage: data.coverImage,
          status: data.status,
          publishedAt: data.status === "published" ? new Date().toISOString() : null
        })
      }
    })

    revalidatePath("/websites/blogs")
    return { success: true, post }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteBlogPost(id: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    await db.snapshot.deleteMany({
      where: { id, agencyId: auth.agencyId, version: "blog_post" }
    })

    revalidatePath("/websites/blogs")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
