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

  const contactsResponse = await getContacts() 
  const contacts = 'data' in contactsResponse && contactsResponse.data ? contactsResponse.data : []

  return <ContactsClient initialContacts={contacts} />
}
