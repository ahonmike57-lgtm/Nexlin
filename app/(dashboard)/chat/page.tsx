export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import ChatClient from "./ChatClient"
import { getConversations } from "@/app/actions/chat"

export default async function ChatPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const conversationsResponse = await getConversations()
  const initialConversations = 'data' in conversationsResponse && conversationsResponse.data ? conversationsResponse.data : []

  return <ChatClient initialConversations={initialConversations} />
}
