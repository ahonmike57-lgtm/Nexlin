export const dynamic = 'force-dynamic';
import { getContacts } from "@/app/actions/contacts"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import ContactsClient from "./ContactsClient"

export default async function ContactsPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // getContacts now dynamically provisions and fetches via the session context on the server
  
  const contactsResponse = await getContacts() 
  const contacts = contactsResponse.data || []

  return <ContactsClient initialContacts={contacts} />
}

