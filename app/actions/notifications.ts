"use server"

import { db } from "@/lib/db"
import { withAgency } from "@/lib/tenant"
import { pusherServer } from "@/lib/pusher"
import { revalidatePath } from "next/cache"

/**
 * Get recent and unread notifications for the current agency.
 */
export const getNotifications = withAgency(
  async ({ db, agencyId }) => {
    const notifications = await db.notification.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    const unreadCount = await db.notification.count({
      where: { agencyId, read: false },
    })

    return {
      notifications,
      unreadCount,
    }
  }
)

/**
 * Create a persistent notification and broadcast live via Pusher.
 */
export const createNotification = withAgency(
  async ({ db, agencyId }, data: { title: string; body: string; type?: string; link?: string; userId?: string }) => {
    const notification = await db.notification.create({
      data: {
        agencyId,
        userId: data.userId || null,
        type: data.type || "system",
        title: data.title,
        body: data.body,
        link: data.link || null,
        read: false,
      },
    })

    // Broadcast live alert
    try {
      await pusherServer.trigger(`agency-${agencyId}`, "new-notification", {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        createdAt: notification.createdAt,
      })
    } catch {}

    return notification
  }
)

/**
 * Mark a single notification as read.
 */
export const markNotificationAsRead = withAgency(
  async ({ db, agencyId }, id: string) => {
    await db.notification.updateMany({
      where: { id, agencyId },
      data: { read: true },
    })

    return { success: true, id }
  }
)

/**
 * Mark all agency notifications as read.
 */
export const markAllNotificationsAsRead = withAgency(
  async ({ db, agencyId }) => {
    await db.notification.updateMany({
      where: { agencyId, read: false },
      data: { read: true },
    })

    return { success: true }
  }
)
