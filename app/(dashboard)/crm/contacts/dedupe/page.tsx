export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { findDuplicateContacts } from "@/app/actions/contacts-dedupe"
import DedupeClient from "./DedupeClient"

export default async function DedupePage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const res = await findDuplicateContacts()
  const duplicates = 'data' in res && res.data ? res.data : []

  return <DedupeClient initialDuplicates={duplicates} />
}
