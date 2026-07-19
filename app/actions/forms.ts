"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { generateAiReply } from "./ai"

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
