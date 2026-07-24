"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function getOrCreateAgency() {
  const session = await getSession()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  if ((session.user as any).isPlatformAdmin) {
    redirect("/platform")
  }

  const userId = session.user.id

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { agency: true }
  })

  if (!user) {
    throw new Error("User not found")
  }

  if (user.agencyId && user.agency) {
    return user.agency.id
  }

  // Create a default Platform if it doesn't exist
  let platform = await db.platform.findFirst()
  if (!platform) {
    platform = await db.platform.create({
      data: { name: "NEXLIN GHL" }
    })
  }

  // Create a default Agency for this user
  const agency = await db.agency.create({
    data: {
      name: `${user.name || "My"} Agency`,
      subdomain: `agency-${userId.substring(0, 8)}`,
      platformId: platform.id,
    }
  })

  // Update user with the new agencyId
  await db.user.update({
    where: { id: userId },
    data: { agencyId: agency.id }
  })

  return agency.id
}
