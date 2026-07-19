"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getVoiceAgents(agencyId: string) {
  try {
    const agents = await db.voiceAgent.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, agents }
  } catch (error) {
    console.error("Error fetching voice agents:", error)
    return { success: false, error: "Failed to fetch voice agents" }
  }
}

export async function saveVoiceAgent(agencyId: string, data: any) {
  try {
    let agent;
    if (data.id) {
      agent = await db.voiceAgent.update({
        where: { id: data.id },
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
    } else {
      agent = await db.voiceAgent.create({
        data: {
          agencyId,
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
