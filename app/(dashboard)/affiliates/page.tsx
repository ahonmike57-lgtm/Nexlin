export const dynamic = 'force-dynamic'

import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import AffiliatesClient from "./AffiliatesClient"

export default async function AffiliatesPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = await getOrCreateAgency()
  return <AffiliatesClient agencyId={agencyId} />
}
