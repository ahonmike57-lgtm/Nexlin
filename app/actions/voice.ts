"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireTenantAuth } from "@/lib/permissions"

export async function getVoiceAgents(_agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agents = await db.voiceAgent.findMany({
      where: { agencyId: auth.agencyId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, agents }
  } catch (error) {
    console.error("Error fetching voice agents:", error)
    return { success: false, error: "Failed to fetch voice agents" }
  }
}

export async function saveVoiceAgent(_agencyId: string, data: any) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    let agent: any
    if (data.id) {
      const updated = await db.voiceAgent.updateMany({
        where: { 
          id: data.id,
          agencyId: auth.agencyId
        },
        data: {
          name: data.name,
          systemPrompt: data.systemPrompt,
          voiceId: data.voiceId,
          greeting: data.greeting,
          isActive: data.isActive,
          missedCallEnabled: data.missedCallEnabled,
          missedCallMessage: data.missedCallMessage,
          missedCallAIFollowUp: data.missedCallAIFollowUp
        }
      })

      if (updated.count === 0) {
        return { success: false, error: "Voice agent not found" }
      }

      agent = await db.voiceAgent.findFirst({
        where: { id: data.id, agencyId: auth.agencyId }
      })
    } else {
      agent = await db.voiceAgent.create({
        data: {
          agencyId: auth.agencyId,
          name: data.name,
          systemPrompt: data.systemPrompt,
          voiceId: data.voiceId,
          greeting: data.greeting,
          isActive: data.isActive,
          missedCallEnabled: data.missedCallEnabled,
          missedCallMessage: data.missedCallMessage,
          missedCallAIFollowUp: data.missedCallAIFollowUp
        }
      })
    }
    revalidatePath("/voice")
    return { success: true, agent }
  } catch (error) {
    console.error("Error saving voice agent:", error)
    return { success: false, error: "Failed to save voice agent" }
  }
}
