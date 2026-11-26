"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { encryptConfig } from "@/lib/encryption"
import { publishSocialPostInternal } from "@/lib/social"
import { revalidatePath } from "next/cache"

// ─── Social Accounts ─────────────────────────────────────────────────────────

export async function getSocialAccounts() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const accounts = await db.socialAccount.findMany({
      where: { agencyId: auth.agencyId },
      orderBy: { platform: "asc" }
    })

    // Strip access tokens entirely before returning to client
    const safe = accounts.map(({ accessToken, ...rest }) => ({
      ...rest,
      hasToken: !!accessToken
    }))

    return { success: true, accounts: safe }
  } catch (error) {
    console.error("Error fetching social accounts:", error)
    return { success: false, error: "Failed to fetch accounts" }
  }
}

export async function connectSocialAccount(platform: string, handle: string, rawAccessToken?: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const cleanToken = rawAccessToken?.trim()
    const encryptedToken = cleanToken ? encryptConfig(cleanToken) : null

    const account = await db.socialAccount.create({
      data: {
        agencyId: auth.agencyId,   // always from session
        platform,
        handle,
        accessToken: encryptedToken,
        isActive: true
      }
    })

    revalidatePath("/social")
    const { accessToken, ...safe } = account
    return { success: true, account: { ...safe, hasToken: !!accessToken } }
  } catch (error) {
    console.error("Error connecting social account:", error)
    return { success: false, error: "Failed to connect account" }
  }
}

export async function disconnectSocialAccount(accountId: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    // Scope delete to agencyId — prevents cross-tenant disconnect
    await db.socialAccount.deleteMany({
      where: { id: accountId, agencyId: auth.agencyId }
    })
    revalidatePath("/social")
    return { success: true }
  } catch (error) {
    console.error("Error disconnecting social account:", error)
    return { success: false, error: "Failed to disconnect account" }
  }
}

// ─── Social Posts ─────────────────────────────────────────────────────────────

export async function getSocialPosts() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const posts = await db.socialPost.findMany({
      where: { agencyId: auth.agencyId },
      include: { account: { select: { id: true, platform: true, handle: true, isActive: true } } },
      orderBy: { scheduledFor: "asc" }
    })
    return { success: true, posts }
  } catch (error) {
    console.error("Error fetching social posts:", error)
    return { success: false, error: "Failed to fetch posts" }
  }
}

export async function createSocialPost(accountId: string, content: string, scheduledFor: Date) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    // Confirm accountId belongs to this agency
    const account = await db.socialAccount.findFirst({
      where: { id: accountId, agencyId: auth.agencyId }
    })
    if (!account) {
      return { success: false, error: "Social account not found" }
    }

    const post = await db.socialPost.create({
      data: {
        agencyId: auth.agencyId,
        accountId,
        content,
        scheduledFor,
        status: "scheduled"
      }
    })
    revalidatePath("/social")
    return { success: true, post }
  } catch (error) {
    console.error("Error creating social post:", error)
    return { success: false, error: "Failed to schedule post" }
  }
}

export async function publishSocialPostNow(postId: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const post = await db.socialPost.findFirst({
      where: { id: postId, agencyId: auth.agencyId },
      include: { account: true }
    })

    if (!post) {
      return { success: false, error: "Post not found" }
    }

    const result = await publishSocialPostInternal(post)

    const updated = await db.socialPost.update({
      where: { id: postId },
      data: {
        status: result.ok ? "published" : "failed",
        publishedAt: result.ok ? new Date() : null
      }
    })

    revalidatePath("/social")
    if (!result.ok) {
      return { success: false, error: result.error || "Failed to publish post", post: updated }
    }
    return { success: true, post: updated, externalPostId: result.externalPostId || "" }
  } catch (err: any) {
    console.error("Error publishing social post:", err)
    return { success: false, error: "Failed to publish post" }
  }
}
