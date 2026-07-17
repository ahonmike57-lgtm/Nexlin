export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import ChatClient from "./ChatClient"
import { getConversations } from "@/app/actions/chat"
import { getOrCreateAgency } from "@/app/actions/agency"

export default async function ChatPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = await getOrCreateAgency()
  const conversationsResponse = await getConversations()
  const initialConversations = conversationsResponse.data || []

  return <ChatClient initialConversations={initialConversations} />
}
