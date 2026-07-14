import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { db } from '@/lib/db'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, contactId } = await req.json()

  // Fetch the contact context if provided
  let systemPrompt = "You are a helpful AI assistant for Nexlin CRM."
  
  if (contactId) {
    const contact = await db.contact.findUnique({
      where: { id: contactId },
      include: { agency: true }
    })
    
    if (contact) {
      systemPrompt = `You are a helpful customer support AI agent working for ${contact.agency.name || 'a business'}. 
You are speaking directly to a customer.
Customer Name: ${contact.firstName} ${contact.lastName || ''}
Company: ${contact.company || 'Unknown'}
Email: ${contact.email || 'Unknown'}

Be extremely polite, concise, and professional. 
If they ask questions you do not know the answer to, politely explain that a human agent will follow up shortly.`
    }
  }

  // Use Google's Gemini 1.5 Pro model via the AI SDK
  const result = streamText({
    model: google('gemini-1.5-flash'),
    system: systemPrompt,
    messages,
  })

  return result.toTextStreamResponse()
}
