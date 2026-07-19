"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { generateAiReply } from "./ai"

export async function getForms(agencyId: string) {
  try {
    const forms = await db.form.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, data: forms }
  } catch (error) {
    console.error("Failed to fetch forms:", error)
    return { success: false, error: "Failed to fetch forms", data: [] }
  }
}

export async function createForm(agencyId: string, name: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const form = await db.form.create({
      data: {
        agencyId,
        name,
        fields: "[]",
        status: "draft"
      }
    })

    revalidatePath("/forms")
    return { success: true, data: form }
  } catch (error) {
    console.error("Failed to create form:", error)
    return { success: false, error: "Failed to create form" }
  }
}

export async function deleteForm(id: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await db.form.delete({ where: { id } })
    revalidatePath("/forms")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete form:", error)
    return { success: false, error: "Failed to delete form" }
  }
}

export async function updateFormFields(id: string, fields: any[]) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Assuming the Form model exists in Prisma
    await db.form.update({
      where: { id },
      data: { fields: JSON.stringify(fields) }
    })
    
    revalidatePath(`/forms/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to update form fields:", error)
    return { success: false, error: "Failed to update form fields" }
  }
}

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
