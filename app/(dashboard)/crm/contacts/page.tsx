import { getContacts } from "@/app/actions/contacts"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import ContactsClient from "./ContactsClient"

export default async function ContactsPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Assuming agency is linked to user. In a real app we'd fetch agencyId from session/user
  // For now we just use a default or fetch by userId
  // Here we'll just mock agencyId as "agency-1" or fetch all for now
  
  const contactsResponse = await getContacts("agency-1") // we'll use a hardcoded agencyId until we set up onboarding fully
  const contacts = contactsResponse.data || []

  return <ContactsClient initialContacts={contacts} />
}
