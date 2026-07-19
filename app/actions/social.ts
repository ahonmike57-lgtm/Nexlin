"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getSocialAccounts(agencyId: string) {
  try {
    const accounts = await db.socialAccount.findMany({
      where: { agencyId },
      orderBy: { platform: 'asc' }
    })
    return { success: true, accounts }
  } catch (error) {
    console.error("Error fetching social accounts:", error)
    return { success: false, error: "Failed to fetch accounts" }
  }
}

export async function connectSocialAccount(agencyId: string, platform: string, handle: string) {
  try {
    const account = await db.socialAccount.create({
      data: {
        agencyId,
        platform,
        handle,
        accessToken: "mock_token_" + Math.random().toString(36).substring(7),
        isActive: true
      }
    })
    revalidatePath("/social")
    return { success: true, account }
  } catch (error) {
    console.error("Error connecting social account:", error)
    return { success: false, error: "Failed to connect account" }
  }
}

export async function disconnectSocialAccount(accountId: string) {
  try {
    await db.socialAccount.delete({
      where: { id: accountId }
    })
    revalidatePath("/social")
    return { success: true }
  } catch (error) {
    console.error("Error disconnecting social account:", error)
    return { success: false, error: "Failed to disconnect account" }
  }
}

export async function getSocialPosts(agencyId: string) {
  try {
    const posts = await db.socialPost.findMany({
      where: { agencyId },
      include: { account: true },
      orderBy: { scheduledFor: 'asc' }
    })
    return { success: true, posts }
  } catch (error) {
    console.error("Error fetching social posts:", error)
    return { success: false, error: "Failed to fetch posts" }
  }
}

export async function createSocialPost(agencyId: string, accountId: string, content: string, scheduledFor: Date) {
  try {
    const post = await db.socialPost.create({
      data: {
        agencyId,
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
