import { notFound } from "next/navigation"
import { getPublicForm } from "@/app/actions/forms"
import PublicFormClient from "./PublicFormClient"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const form = await getPublicForm(id)
  if (!form) return { title: "Form Not Found | Nexlin" }
  return {
    title: `${form.name} | ${form.agencyName}`,
    description: `Complete the ${form.name} intake form for ${form.agencyName}.`
  }
}

export default async function PublicFormPage({ params }: Props) {
  const { id } = await params
  const form = await getPublicForm(id)

  if (!form) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-lg">
        <PublicFormClient form={form} />
      </div>
    </div>
  )
}
