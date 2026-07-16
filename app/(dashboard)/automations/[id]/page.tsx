export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import WorkflowBuilderClient from "./WorkflowBuilderClient"
import { getWorkflow } from "@/app/actions/automations"

export default async function WorkflowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const response = await getWorkflow(id)
  
  if (!response.success || !response.data) {
    notFound()
  }

  return <WorkflowBuilderClient workflow={response.data} />
}
