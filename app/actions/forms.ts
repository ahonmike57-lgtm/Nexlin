"use server"

import { revalidatePath } from "next/cache"
import { withAgency } from "@/lib/tenant"
import { db } from "@/lib/db"
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

export async function getPublicForm(id: string) {
  try {
    const form = await db.form.findUnique({
      where: { id },
      include: { agency: { select: { id: true, name: true, customDomain: true, subdomain: true } } }
    })
    if (!form) return null
    return {
      id: form.id,
      name: form.name,
      fields: form.fields ? JSON.parse(form.fields) : [],
      agencyName: form.agency?.name || "Nexlin Partner",
      agencyId: form.agencyId
    }
  } catch (error) {
    console.error("Error fetching public form:", error)
    return null
  }
}

export async function submitPublicForm(formId: string, values: Record<string, any>) {
  try {
    const form = await db.form.findUnique({
      where: { id: formId }
    })
    if (!form) return { success: false, error: "Form not found" }

    const email = values.email || values.Email || null
    const phone = values.phone || values.Phone || values["Phone Number"] || null
    const fullName = values.name || values.Name || values["Full Name"] || ""
    const [firstName, ...rest] = (fullName as string).split(" ")
    const lastName = rest.join(" ") || values.lastName || values["Last Name"] || ""

    let contact = null
    if (email) {
      contact = await db.contact.findFirst({
        where: { agencyId: form.agencyId, email }
      })
    }

    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId: form.agencyId,
          firstName: firstName || "Form",
          lastName: lastName || "Lead",
          email,
          phone,
          leadScore: 40,
          tags: `form_submission,${form.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
        }
      })
    } else {
      await db.contact.update({
        where: { id: contact.id },
        data: {
          leadScore: (contact.leadScore || 0) + 15,
          tags: `${contact.tags || ''},form_submission`
        }
      })
    }

    return { success: true, contactId: contact.id }
  } catch (error: any) {
    console.error("Error submitting public form:", error)
    return { success: false, error: error.message || "Failed to submit form" }
  }
}
