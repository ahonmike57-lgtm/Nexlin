"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

import { getSession } from "@/lib/auth"

export async function getVoiceAgents(agencyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const targetAgencyId = session.user.agencyId || agencyId

    const agents = await db.voiceAgent.findMany({
      where: { agencyId: targetAgencyId },
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
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const targetAgencyId = session.user.agencyId || agencyId

    let agent;
    if (data.id) {
      await db.voiceAgent.updateMany({
        where: { 
          id: data.id,
          ...(session.user.agencyId ? { agencyId: session.user.agencyId } : {})
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
      agent = await db.voiceAgent.findFirst({ where: { id: data.id } })
    } else {
      agent = await db.voiceAgent.create({
        data: {
          agencyId: targetAgencyId,
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
