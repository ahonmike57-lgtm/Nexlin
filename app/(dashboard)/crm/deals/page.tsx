import { getDeals } from "@/app/actions/deals"
import { getContacts } from "@/app/actions/contacts"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import DealsClient from "./DealsClient"

export default async function DealsPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Assuming agency is linked to user.
  // For now we just use a default mocked agencyId as "agency-1"
  
  const [dealsResponse, contactsResponse] = await Promise.all([
    getDeals("agency-1"),
    getContacts("agency-1")
  ])
  
  const deals = dealsResponse.data || []
  const contacts = contactsResponse.data || []

  return <DealsClient initialDeals={deals} contacts={contacts} />
}
