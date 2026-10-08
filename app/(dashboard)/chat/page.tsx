export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import ChatClient from "./ChatClient"
import { getConversations } from "@/app/actions/chat"
import { getAgencyConnectedChannels } from "@/app/actions/channel-credentials"

export default async function ChatPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [conversationsResponse, channelsRes] = await Promise.all([
    getConversations(),
    getAgencyConnectedChannels()
  ])
  const initialConversations = 'data' in conversationsResponse && conversationsResponse.data ? conversationsResponse.data : []
  const initialChannels = channelsRes.success && channelsRes.data ? channelsRes.data : null

  return <ChatClient initialConversations={initialConversations} initialChannels={initialChannels} />
}
