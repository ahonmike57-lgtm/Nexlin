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

  // getDeals and getContacts now dynamically provision and fetch via the session context on the server
  
  const [dealsResponse, contactsResponse, pipelinesResponse] = await Promise.all([
    getDeals(),
    getContacts(),
    getPipelines()
  ])
  
  const deals = dealsResponse.data || []
  const contacts = contactsResponse.data || []
  const pipelines = pipelinesResponse.data || []

  return <DealsClient initialDeals={deals} contacts={contacts} pipelines={pipelines} />
}

