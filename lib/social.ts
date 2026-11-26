import { db } from "@/lib/db"
import { decryptConfig } from "@/lib/encryption"

export async function getDecryptedSocialTokenInternal(
  accountId: string,
  agencyId: string
): Promise<string | null> {
  try {
    const account = await db.socialAccount.findFirst({
      where: { id: accountId, agencyId },
      select: { accessToken: true },
    })
    if (!account?.accessToken) return null

    const decrypted = decryptConfig(account.accessToken)
    if (!decrypted || decrypted.startsWith("mock_")) return null
    return decrypted
  } catch {
    return null
  }
}

export async function publishSocialPostInternal(post: {
  id: string
  agencyId: string
  accountId: string
  content: string
  account: { platform: string; handle: string }
}): Promise<{ ok: boolean; externalPostId?: string; error?: string }> {
  const token = await getDecryptedSocialTokenInternal(post.accountId, post.agencyId)
  if (!token) {
    return {
      ok: false,
      error: "No live OAuth access token connected for this social account. Connect a real account before publishing.",
    }
  }

  const platform = post.account.platform.toLowerCase()

  try {
    if (platform === "twitter" || platform === "x") {
      const res = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: post.content }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.data?.id) {
        return { ok: true, externalPostId: data.data.id }
      }
      return {
        ok: false,
        error: data?.detail || data?.title || `Twitter API returned HTTP ${res.status}`,
      }
    }

    if (platform === "facebook" || platform === "instagram") {
      const res = await fetch("https://graph.facebook.com/v19.0/me/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: post.content,
          access_token: token,
        }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.id) {
        return { ok: true, externalPostId: data.id }
      }
      return {
        ok: false,
        error: data?.error?.message || `Meta API returned HTTP ${res.status}`,
      }
    }

    if (platform === "linkedin") {
      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${post.account.handle.replace("@", "")}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: post.content },
              shareMediaCategory: "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.id) {
        return { ok: true, externalPostId: data.id }
      }
      return {
        ok: false,
        error: data?.message || `LinkedIn API returned HTTP ${res.status}`,
      }
    }

    return { ok: false, error: `Unsupported social platform: ${post.account.platform}` }
  } catch (err: any) {
    return { ok: false, error: err?.message || "Social API request failed" }
  }
}
