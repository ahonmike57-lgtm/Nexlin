"use server"

import { revalidatePath } from "next/cache"
import { db as prisma } from "@/lib/db"

export async function getForms(agencyId: string) {
  try {
    const forms = await prisma.form.findMany({
      where: { agencyId },
      include: {
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, forms }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createForm(agencyId: string, name: string) {
  try {
    // Default standard fields
    const defaultFields = JSON.stringify([
      { id: "fname", type: "text", label: "First Name", required: true },
      { id: "lname", type: "text", label: "Last Name", required: false },
      { id: "email", type: "email", label: "Email", required: true },
      { id: "phone", type: "tel", label: "Phone", required: false }
    ])

    const form = await prisma.form.create({
      data: {
        agencyId,
        name,
        fields: defaultFields
      }
    })

    revalidatePath("/forms")
    return { success: true, form }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
