"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"

export async function getCommunityLeaderboard() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const badges = await db.snapshot.findMany({
      where: { agencyId: auth.agencyId, version: "community_badge" }
    })

    const memberScores: Record<string, { points: number; badgeCount: number }> = {}

    for (const b of badges) {
      if (!b.description) continue
      const data = JSON.parse(b.description)
      const memberId = data.contactId || "anonymous"
      if (!memberScores[memberId]) memberScores[memberId] = { points: 0, badgeCount: 0 }
      memberScores[memberId].points += data.points || 50
      memberScores[memberId].badgeCount += 1
    }

    const leaderboard = Object.entries(memberScores)
      .map(([memberId, data]) => ({
        memberId,
        points: data.points,
        level: Math.floor(data.points / 100) + 1,
        badgeCount: data.badgeCount
      }))
      .sort((a, b) => b.points - a.points)

    return { success: true, leaderboard }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
