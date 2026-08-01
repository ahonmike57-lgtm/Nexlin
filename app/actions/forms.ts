"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { generateAiReply } from "./ai"

export const getForms = withAgency(async ({ db }) => {
  return db.form.findMany({
    where: {},
    orderBy: { createdAt: "desc" }
  })
})

export const createForm = withAgency(
  async ({ db, agencyId }, name: string) => {
    const form = await db.form.create({
      data: {
        agencyId,
        name,
        fields: "[]"
      }
    })

    revalidatePath("/forms")
    return form
  }
)

export const deleteForm = withAgency(
  async ({ db }, id: string) => {
    const deleted = await db.form.deleteMany({ where: { id } })
    if (deleted.count === 0) throw new Error("Form not found or access denied")
    revalidatePath("/forms")
    return { id }
  }
)

export const updateFormFields = withAgency(
  async ({ db }, id: string, fields: any[]) => {
    await db.form.updateMany({
      where: { id },
      data: { fields: JSON.stringify(fields) }
    })

    revalidatePath(`/forms/${id}`)
    return { id }
  }
)

export async function generateFormFields(prompt: string) {
  try {
    const aiRes = await generateAiReply("form_generator", prompt)
    if (!aiRes.success || !aiRes.data) {
      throw new Error(aiRes.error || "Failed to generate form via AI")
    }

    let parsed
    try {
      const rawJson = aiRes.data.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(rawJson)
    } catch (e) {
      console.error("Failed to parse form JSON:", aiRes.data)
      throw new Error("AI returned invalid form structure")
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    console.error("Failed to generate form fields:", error)
    return { success: false, error: error.message || "Failed to generate form" }
  }
}

export async function optimizeFieldLabel(label: string) {
  try {
    const aiRes = await generateAiReply("field_optimizer", label)
    if (!aiRes.success || !aiRes.data) {
      throw new Error(aiRes.error || "Failed to optimize label")
    }
    return { success: true, data: aiRes.data.trim() }
  } catch (error: any) {
    console.error("Failed to optimize field label:", error)
    return { success: false, error: error.message || "Failed to optimize label" }
  }
}
