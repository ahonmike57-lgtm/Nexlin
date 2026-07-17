"use server"

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createSnapshot(agencyId: string, name: string, description?: string) {
  try {
    // 1. Fetch all assets for this agency to snapshot
    const funnels = await prisma.funnel.findMany({
      where: { agencyId, subAgencyId: null },
      include: { steps: true }
    })
    
    const workflows = await prisma.workflow.findMany({
      where: { agencyId, subAgencyId: null },
      include: { triggers: true, actions: true }
    })
    
    const pipelines = await prisma.pipeline.findMany({
      where: { agencyId, subAgencyId: null },
      include: { stages: true }
    })

    // 2. Create the Snapshot parent record
    const snapshot = await prisma.snapshot.create({
      data: {
        agencyId,
        name,
        description,
        version: "1.0.0",
        isPublic: false,
      }
    })

    // 3. Create the SnapshotAsset records
    const assetPromises = []

    for (const f of funnels) {
      assetPromises.push(prisma.snapshotAsset.create({
        data: {
          snapshotId: snapshot.id,
          type: "funnel",
          sourceId: f.id,
          data: JSON.stringify(f)
        }
      }))
    }

    for (const w of workflows) {
      assetPromises.push(prisma.snapshotAsset.create({
        data: {
          snapshotId: snapshot.id,
          type: "workflow",
          sourceId: w.id,
          data: JSON.stringify(w)
        }
      }))
    }

    for (const p of pipelines) {
      assetPromises.push(prisma.snapshotAsset.create({
        data: {
          snapshotId: snapshot.id,
          type: "pipeline",
          sourceId: p.id,
          data: JSON.stringify(p)
        }
      }))
    }

    await Promise.all(assetPromises)
    
    revalidatePath("/settings/snapshots")
    return { success: true, data: snapshot }
  } catch (error: any) {
    console.error("Error creating snapshot:", error)
    return { success: false, error: error.message }
  }
}

export async function getSnapshots(agencyId: string) {
  try {
    const snapshots = await prisma.snapshot.findMany({
      where: { agencyId },
      include: { 
        _count: {
          select: { assets: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, data: snapshots }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deploySnapshot(snapshotId: string, targetSubAgencyId: string, targetAgencyId: string) {
  try {
    const snapshot = await prisma.snapshot.findUnique({
      where: { id: snapshotId },
      include: { assets: true }
    })

    if (!snapshot) throw new Error("Snapshot not found")

    // Deploy assets
    for (const asset of snapshot.assets) {
      const data = JSON.parse(asset.data)

      if (asset.type === "funnel") {
        const createdFunnel = await prisma.funnel.create({
          data: {
            agencyId: targetAgencyId,
            subAgencyId: targetSubAgencyId,
            name: `${data.name} (from Snapshot)`,
            status: "draft"
          }
        })
        
        if (data.steps && data.steps.length > 0) {
          await prisma.funnelStep.createMany({
            data: data.steps.map((step: any) => ({
              funnelId: createdFunnel.id,
              name: step.name,
              path: step.path,
              order: step.order,
              content: step.content,
              config: step.config
            }))
          })
        }
      } 
      else if (asset.type === "workflow") {
        const createdWorkflow = await prisma.workflow.create({
          data: {
            agencyId: targetAgencyId,
            subAgencyId: targetSubAgencyId,
            name: `${data.name} (from Snapshot)`,
            status: "draft"
          }
        })

        if (data.triggers && data.triggers.length > 0) {
          await prisma.workflowTrigger.createMany({
            data: data.triggers.map((t: any) => ({
              workflowId: createdWorkflow.id,
              type: t.type,
              config: t.config
            }))
          })
        }

        if (data.actions && data.actions.length > 0) {
          await prisma.workflowAction.createMany({
            data: data.actions.map((a: any) => ({
              workflowId: createdWorkflow.id,
              type: a.type,
              order: a.order,
              config: a.config
            }))
          })
        }
      }
      else if (asset.type === "pipeline") {
        const createdPipeline = await prisma.pipeline.create({
          data: {
            agencyId: targetAgencyId,
            subAgencyId: targetSubAgencyId,
            name: `${data.name} (from Snapshot)`,
          }
        })

        if (data.stages && data.stages.length > 0) {
          await prisma.pipelineStage.createMany({
            data: data.stages.map((s: any) => ({
              pipelineId: createdPipeline.id,
              name: s.name,
              color: s.color,
              order: s.order
            }))
          })
        }
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error deploying snapshot:", error)
    return { success: false, error: error.message }
  }
}
