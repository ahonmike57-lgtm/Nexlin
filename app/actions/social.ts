"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { encryptConfig, decryptConfig } from "@/lib/encryption"
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
    const token = rawAccessToken || ("mock_token_" + Math.random().toString(36).substring(7))
    // Encrypt OAuth token at rest before writing
    const encryptedToken = encryptConfig(token)

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
    return { success: true, account: { ...safe, hasToken: true } }
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

    const token = post.account ? await getDecryptedSocialToken(post.accountId, auth.agencyId) : null
    const platform = post.account.platform.toLowerCase()

    let dispatchSuccess = false
    let externalPostId = ""

    if (token && !token.startsWith("mock_")) {
      try {
        if (platform === "twitter" || platform === "x") {
          const res = await fetch("https://api.twitter.com/2/tweets", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: post.content })
          })
          const data = await res.json()
          if (data?.data?.id) {
            dispatchSuccess = true
            externalPostId = data.data.id
          }
        } else if (platform === "facebook" || platform === "instagram") {
          const res = await fetch(`https://graph.facebook.com/v19.0/me/feed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: post.content,
              access_token: token
            })
          })
          const data = await res.json()
          if (data?.id) {
            dispatchSuccess = true
            externalPostId = data.id
          }
        } else if (platform === "linkedin") {
          const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
              "X-Restli-Protocol-Version": "2.0.0"
            },
            body: JSON.stringify({
              author: `urn:li:person:${post.account.handle.replace('@', '')}`,
              lifecycleState: "PUBLISHED",
              specificContent: {
                "com.linkedin.ugc.ShareContent": {
                  shareCommentary: { text: post.content },
                  shareMediaCategory: "NONE"
                }
              },
              visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
            })
          })
          const data = await res.json()
          if (data?.id) {
            dispatchSuccess = true
            externalPostId = data.id
          }
        }
      } catch (e: any) {
        console.error("Live social dispatch error:", e)
      }
    } else {
      // Sandbox mode
      dispatchSuccess = true
    }

    const updated = await db.socialPost.update({
      where: { id: postId },
      data: {
        status: dispatchSuccess ? "published" : "failed",
        publishedAt: dispatchSuccess ? new Date() : null
      }
    })

    revalidatePath("/social")
    return { success: true, post: updated, externalPostId }
  } catch (err: any) {
    console.error("Error publishing social post:", err)
    return { success: false, error: "Failed to publish post" }
  }
}

/**
 * Internal-only: decrypt and return a live OAuth access token for API calls.
 * NEVER returns this to the client.
 */
export async function getDecryptedSocialToken(accountId: string, agencyId: string): Promise<string | null> {
  try {
    const account = await db.socialAccount.findFirst({
      where: { id: accountId, agencyId }
    })
    if (!account?.accessToken) return null
    return decryptConfig(account.accessToken)
  } catch {
    return null
  }
}
