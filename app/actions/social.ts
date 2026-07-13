"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getSocialAccounts(agencyId: string) {
  try {
    const accounts = await db.socialAccount.findMany({
      where: { agencyId },
    })
    return { success: true, accounts }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getSocialPosts(agencyId: string) {
  try {
    const posts = await db.socialPost.findMany({
      where: { agencyId },
      include: {
        account: true,
      },
      orderBy: {
        scheduledFor: "asc",
      },
    })
    return { success: true, posts }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createSocialPost(agencyId: string, data: any) {
  try {
    const post = await db.socialPost.create({
      data: {
        ...data,
        agencyId,
      },
    })
    revalidatePath("/social")
    return { success: true, post }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
