import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import ChatClient from "./ChatClient"
import { getConversations } from "@/app/actions/chat"
import { db } from "@/lib/db"

export default async function ChatPage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1" // Mock agency ID

  // Auto-seed mock data if empty (for the mock experience)
  const count = await db.conversation.count({ where: { agencyId } })
  if (count === 0) {
    // Seed some mock conversations
    const contact = await db.contact.findFirst({ where: { agencyId } })
    if (contact) {
      const conv = await db.conversation.create({
        data: {
          agencyId,
          contactId: contact.id,
          channel: "email",
        }
      })
      await db.message.create({
        data: {
          conversationId: conv.id,
          content: "Hi! I just reviewed the pricing document.",
          isOutbound: false
        }
      })
    }
  }

  const conversationsResponse = await getConversations(agencyId)
  const initialConversations = conversationsResponse.data || []

  return <ChatClient initialConversations={initialConversations} />
}
