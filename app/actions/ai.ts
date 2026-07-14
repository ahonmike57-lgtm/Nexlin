"use server"

import { getSession } from "@/lib/auth"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { db } from "@/lib/db"

export async function generateAiReply(context: string, prompt: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // If no API key is provided, gracefully fallback to mock
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.warn("No GOOGLE_GENERATIVE_AI_API_KEY found, falling back to mock response.")
      await new Promise(resolve => setTimeout(resolve, 1500))
      let response = ""
      if (context === "chat") {
        response = "Thank you for reaching out! We've received your message and our team will get back to you shortly."
      } else if (context === "marketing") {
        response = "Unlock Your Business Potential! \n\nHey there, \n\nAre you looking to scale your business? We just launched our newest feature designed to double your conversions..."
      } else {
        response = "Here is some AI generated text based on your prompt."
      }
      return { success: true, data: response }
    }

    let systemPrompt = "You are a helpful business assistant."
    if (context === "chat") {
      systemPrompt = "You are an intelligent customer support agent. Generate a concise, friendly reply to the customer's message based on the context. If the prompt contains a conversation ID, imagine you are responding to the user's last message."
    } else if (context === "marketing") {
      systemPrompt = "You are an expert copywriter. Generate a high-converting marketing email."
    }

    // If context is chat and prompt is a conversation ID, we should try to fetch the actual messages!
    let finalPrompt = prompt
    if (context === "chat") {
      const messages = await db.message.findMany({
        where: { conversationId: prompt },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      if (messages.length > 0) {
        // Format previous messages
        finalPrompt = "Here are the recent messages in this conversation (newest first):\n" + 
          messages.map(m => `${m.isOutbound ? 'Agent' : 'Customer'}: ${m.content}`).join("\n") +
          "\n\nWrite a helpful, natural response to the customer."
      }
    }

    const { text } = await generateText({
      model: google("gemini-1.5-pro-latest"),
      system: systemPrompt,
      prompt: finalPrompt
    })

    return { success: true, data: text }
  } catch (error: any) {
    console.error("AI Error:", error)
    return { success: false, error: error?.message || "Failed to generate AI content" }
  }
}
