import { NextResponse } from 'next/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai'
import { db } from '@/lib/db'
import { requireTenantAuth } from '@/lib/permissions'
import { checkRateLimit } from '@/lib/rate-limit'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`ai-chat:${auth.userId}`, { maxRequests: 30, windowSeconds: 60 })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many AI chat requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
    )
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const { messages, contactId } = body || {}
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid messages payload" }, { status: 400 })
  }

  // Fetch the contact context if provided (strictly scoped to caller's agency)
  let systemPrompt = "You are a helpful AI assistant for Nexlin CRM."
  
  if (typeof contactId === "string" && contactId.trim()) {
    const contact = await db.contact.findFirst({
      where: { id: contactId.trim(), agencyId: auth.agencyId },
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

  const googleProvider = createGoogleGenerativeAI({ apiKey })
  const result = streamText({
    model: googleProvider('gemini-2.0-flash'),
    system: systemPrompt,
    messages,
  })

  return result.toTextStreamResponse()
}
