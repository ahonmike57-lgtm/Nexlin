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

    // Dynamically fetch available models to prevent versioning/deprecation errors
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`)
    const modelsData = await modelsRes.json()
    
    let selectedModel = "gemini-pro"
    
    if (modelsData && modelsData.models) {
      // Find all models that support text generation
      let availableModels = modelsData.models.filter((m: any) => 
        m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
      )
      
      // Filter out any models we know throw quota/deprecation errors for this user
      availableModels = availableModels.filter((m: any) => 
        !m.name.includes("gemini-2.5-flash") && !m.name.includes("gemini-2.5-pro")
      )

      // Sort by version number descending (e.g. 3.0 > 2.5 > 2.0 > 1.5)
      availableModels.sort((a: any, b: any) => {
        const vA = parseFloat(a.name.match(/\d+\.\d+/)?.[0] || "0")
        const vB = parseFloat(b.name.match(/\d+\.\d+/)?.[0] || "0")
        return vB - vA
      })

      if (availableModels.length > 0) {
        selectedModel = availableModels[0].name.replace("models/", "")
      }
    }

    const { text } = await generateText({
      model: google(selectedModel),
      system: systemPrompt,
      prompt: finalPrompt
    })

    return { success: true, data: text }
  } catch (error: any) {
    console.error("AI Error:", error)
    
    let errorMsg = error?.message || "Failed to generate AI content"
    if (errorMsg.includes("API call error") || errorMsg.includes("fetch failed")) {
      errorMsg = "Your API Key is invalid or restricted! Please double check your Vercel Environment Variables and ensure there are no spaces in the key."
    }
    
    return { success: false, error: errorMsg }
  }
}
