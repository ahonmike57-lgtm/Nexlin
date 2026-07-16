export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAgencyPhoneData } from "@/app/actions/telephony"
import PhoneNumbersClient from "./PhoneNumbersClient"

export default async function PhoneNumbersPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1" // Mock agency ID

  const res = await getAgencyPhoneData(agencyId)
  
  return (
    <PhoneNumbersClient 
      initialNumbers={res.success ? res.numbers || [] : []} 
      initialPortRequests={res.success ? res.portRequests || [] : []}
      agencyId={agencyId}
    />
  )
}

