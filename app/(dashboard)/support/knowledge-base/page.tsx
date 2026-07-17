export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKnowledgeArticles } from "@/app/actions/knowledge"
import KnowledgeClient from "./KnowledgeClient"

export default async function KnowledgeBasePage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = session.user.id

  const res = await getKnowledgeArticles(agencyId)
  const initialArticles = res.success && res.articles ? res.articles : []

  return <KnowledgeClient initialArticles={initialArticles} agencyId={agencyId} />
}

