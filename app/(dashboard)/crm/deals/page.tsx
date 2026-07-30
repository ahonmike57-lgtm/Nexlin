export const dynamic = 'force-dynamic';
import { getDeals } from "@/app/actions/deals"
import { getContacts } from "@/app/actions/contacts"
import { getPipelines } from "@/app/actions/pipelines"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import DealsClient from "./DealsClient"

export default async function DealsPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [dealsResponse, contactsResponse, pipelinesResponse] = await Promise.all([
    getDeals(),
    getContacts(),
    getPipelines()
  ])
  
  const deals = 'data' in dealsResponse && dealsResponse.data ? dealsResponse.data : []
  const contacts = 'data' in contactsResponse && contactsResponse.data ? contactsResponse.data : []
  const pipelines = 'data' in pipelinesResponse && pipelinesResponse.data ? pipelinesResponse.data : []

  return <DealsClient initialDeals={deals} contacts={contacts} pipelines={pipelines} />
}
