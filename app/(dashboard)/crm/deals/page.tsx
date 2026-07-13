import { getDeals } from "@/app/actions/deals"
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
  
  const dealsResponse = await getDeals("agency-1")
  const deals = dealsResponse.data || []

  return <DealsClient initialDeals={deals} />
}
