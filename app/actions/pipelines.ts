"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function getPipelines() {
  try {
    const cookieStore = await cookies()
    const agencyId = cookieStore.get("agencyId")?.value
    if (!agencyId) return { success: false, error: "Unauthorized" }

    const pipelines = await db.pipeline.findMany({
      where: { agencyId },
      include: {
        stages: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, data: pipelines }
  } catch (error: any) {
    console.error("Error fetching pipelines:", error)
    return { success: false, error: error.message }
  }
}

export async function createPipeline(name: string, stages: { name: string, color: string }[]) {
  try {
    const cookieStore = await cookies()
    const agencyId = cookieStore.get("agencyId")?.value
    if (!agencyId) return { success: false, error: "Unauthorized" }

    const pipeline = await db.pipeline.create({
      data: {
        agencyId,
        name,
        stages: {
          create: stages.map((s, idx) => ({
            name: s.name,
            color: s.color,
            order: idx
          }))
        }
      }
    })

    revalidatePath("/settings/pipelines")
    revalidatePath("/crm/deals")
    return { success: true, data: pipeline }
  } catch (error: any) {
    console.error("Error creating pipeline:", error)
    return { success: false, error: error.message }
  }
}

export async function updatePipeline(pipelineId: string, name: string, stages: { id?: string, name: string, color: string }[]) {
  try {
    const cookieStore = await cookies()
    const agencyId = cookieStore.get("agencyId")?.value
    if (!agencyId) return { success: false, error: "Unauthorized" }

    // First update the pipeline name
    await db.pipeline.update({
      where: { id: pipelineId },
      data: { name }
    })

    // For stages, we need to handle creates, updates, and deletes
    // Get existing stages
    const existingStages = await db.pipelineStage.findMany({ where: { pipelineId } })
    
    // Identify stages to delete (exists in DB but not in the new array)
    const newStageIds = stages.filter(s => s.id).map(s => s.id)
    const stagesToDelete = existingStages.filter(s => !newStageIds.includes(s.id))
    
    if (stagesToDelete.length > 0) {
      await db.pipelineStage.deleteMany({
        where: { id: { in: stagesToDelete.map(s => s.id) } }
      })
    }

    // Upsert remaining stages
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      if (stage.id) {
        await db.pipelineStage.update({
          where: { id: stage.id },
          data: { name: stage.name, color: stage.color, order: i }
        })
      } else {
        await db.pipelineStage.create({
          data: {
            pipelineId,
            name: stage.name,
            color: stage.color,
            order: i
          }
        })
      }
    }

    revalidatePath("/settings/pipelines")
    revalidatePath("/crm/deals")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating pipeline:", error)
    return { success: false, error: error.message }
  }
}

export async function deletePipeline(pipelineId: string) {
  try {
    const cookieStore = await cookies()
    const agencyId = cookieStore.get("agencyId")?.value
    if (!agencyId) return { success: false, error: "Unauthorized" }

    await db.pipeline.delete({
      where: { id: pipelineId, agencyId }
    })

    revalidatePath("/settings/pipelines")
    revalidatePath("/crm/deals")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting pipeline:", error)
    return { success: false, error: error.message }
  }
}
