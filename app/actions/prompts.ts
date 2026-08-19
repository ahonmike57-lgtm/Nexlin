"use server"

import { withAgency } from "@/lib/tenant"

// ─── Saved Custom Prompt Templates (stored as Snapshots) ───────────────────

export const savePromptTemplate = withAgency(
  async (
    { db, agencyId },
    data: { name: string; category: string; prompt: string }
  ) => {
    return db.snapshot.create({
      data: {
        agencyId,
        name: data.name,
        description: JSON.stringify({
          type: "vibecode_prompt",
          category: data.category,
          prompt: data.prompt,
        }),
        version: "1.0.0",
        isPublic: false,
      },
    })
  }
)

export const listSavedPrompts = withAgency(async ({ db }) => {
  const snapshots = await db.snapshot.findMany({
    orderBy: { createdAt: "desc" },
  })
  return snapshots.filter((s) => {
    try {
      const meta = JSON.parse(s.description ?? "{}")
      return meta.type === "vibecode_prompt"
    } catch {
      return false
    }
  })
})

export const deletePromptTemplate = withAgency(
  async ({ db }, snapshotId: string) => {
    return db.snapshot.deleteMany({ where: { id: snapshotId } })
  }
)
