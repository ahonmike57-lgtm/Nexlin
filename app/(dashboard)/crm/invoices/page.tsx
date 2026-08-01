export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCPQQuotes } from "@/app/actions/cpq"
import InvoicesClient from "./InvoicesClient"

export default async function InvoicesPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const quotesResponse = await getCPQQuotes()
  const quotes = 'data' in quotesResponse && quotesResponse.data ? quotesResponse.data : []

  return <InvoicesClient initialQuotes={quotes} />
}
