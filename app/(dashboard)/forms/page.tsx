export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { getForms } from "@/app/actions/forms"
import { getOrCreateAgency } from "@/app/actions/agency"
import FormsClient from "./FormsClient"
import { redirect } from "next/navigation"

export default async function FormsPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const res = await getForms()
  const initialForms = "data" in res && res.data ? res.data : []

  return <FormsClient initialForms={initialForms} agencyId={agencyId} />
}
