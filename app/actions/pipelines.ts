"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { getActiveSubAccountId } from "./subaccounts"

function revalidatePipelines() {
  revalidatePath("/settings/pipelines")
  revalidatePath("/crm/deals")
}

export const getPipelines = withAgency(async ({ db }) => {
  const subAgencyId = await getActiveSubAccountId()

  return db.pipeline.findMany({
    // agencyId is injected by tenantDb — never taken from the client.
    where: subAgencyId ? { subAgencyId } : {},
    include: {
      stages: { orderBy: { order: "asc" } }
    },
    orderBy: { createdAt: "desc" }
  })
})

export const createPipeline = withAgency(
  async ({ db, agencyId }, name: string, stages: { name: string, color: string }[]) => {
    const subAgencyId = await getActiveSubAccountId()

    const pipeline = await db.pipeline.create({
      data: {
        agencyId,
        subAgencyId,
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

    revalidatePipelines()
    return pipeline
  }
)

export const updatePipeline = withAgency(
  async (
    { db },
    pipelineId: string,
    name: string,
    stages: { id?: string, name: string, color: string }[]
  ) => {
    // Confirm the pipeline belongs to this agency before touching anything.
    // findFirst (not findUnique) so the agencyId filter applies.
    const owned = await db.pipeline.findFirst({
      where: { id: pipelineId },
      select: { id: true }
    })

    if (!owned) {
      throw new Error("Pipeline not found")
    }

    await db.pipeline.updateMany({
      where: { id: pipelineId },
      data: { name }
    })

    // PipelineStage has no agencyId of its own, so every stage query is
    // constrained by the parent pipelineId we just verified.
    const existingStages = await db.pipelineStage.findMany({
      where: { pipelineId },
      select: { id: true }
    })

    const incomingIds = stages.filter(s => s.id).map(s => s.id as string)
    const staleIds = existingStages
      .filter(s => !incomingIds.includes(s.id))
      .map(s => s.id)

    if (staleIds.length > 0) {
      await db.pipelineStage.deleteMany({
        where: { id: { in: staleIds }, pipelineId }
      })
    }

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      if (stage.id) {
        await db.pipelineStage.updateMany({
          // pipelineId in the filter stops a caller renaming a stage
          // that belongs to someone else's pipeline.
          where: { id: stage.id, pipelineId },
          data: { name: stage.name, color: stage.color, order: i }
        })
      } else {
        await db.pipelineStage.create({
          data: { pipelineId, name: stage.name, color: stage.color, order: i }
        })
      }
    }

    revalidatePipelines()
    return { id: pipelineId }
  }
)

export const deletePipeline = withAgency(async ({ db }, pipelineId: string) => {
  const deleted = await db.pipeline.deleteMany({
    where: { id: pipelineId }
  })

  if (deleted.count === 0) {
    throw new Error("Pipeline not found")
  }

  revalidatePipelines()
  return { id: pipelineId }
})
