import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const userId = session.user.id || (session.user as any).email || "unknown-user"
    const rateLimit = checkRateLimit(`ai-stream:${userId}`, { maxRequests: 30, windowSeconds: 60 })

    if (!rateLimit.allowed) {
      return new Response("Rate limit exceeded. Please wait a moment before sending more AI requests.", {
        status: 429,
        headers: { "Retry-After": String(rateLimit.resetInSeconds) }
      })
    }

    const { prompt, systemInstruction } = await req.json()
    if (!prompt) {
      return new Response("Prompt is required", { status: 400 })
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)?.trim()
    if (!apiKey) {
      return new Response("AI service not configured", { status: 503 })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
        })
      }
    )

    if (!response.ok || !response.body) {
      return new Response("Failed to start AI stream", { status: response.status || 502 })
    }

    return new Response(response.body, {
      headers: { "Content-Type": "application/json" }
    })
  } catch (error: any) {
    console.error("AI Stream Endpoint Error:", error)
    return new Response(error.message || "Streaming failed", { status: 500 })
  }
}
