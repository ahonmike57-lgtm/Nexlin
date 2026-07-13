"use server"

import { getSession } from "@/lib/auth"
import OpenAI from "openai"

export async function generateAiReply(context: string, prompt: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // If no API key is provided, gracefully fallback to mock
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OPENAI_API_KEY found, falling back to mock response.")
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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    let systemPrompt = "You are a helpful business assistant."
    if (context === "chat") {
      systemPrompt = "You are an intelligent customer support agent. Generate a concise, friendly reply to the customer's message based on the context."
    } else if (context === "marketing") {
      systemPrompt = "You are an expert copywriter. Generate a high-converting marketing email."
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    })

    return { success: true, data: completion.choices[0].message.content }
  } catch (error: any) {
    console.error("AI Error:", error)
    return { success: false, error: error?.message || "Failed to generate AI content" }
  }
}
