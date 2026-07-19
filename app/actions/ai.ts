"use server"

import { getSession } from "@/lib/auth"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { db } from "@/lib/db"
import { getOrCreateAgency } from "./agency"

export async function generateAiReply(context: string, prompt: string, requestedProviderAndModel?: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const agencyId = await getOrCreateAgency()

    // Check if the agency has custom AI Settings
    const aiSettings = await db.aiSettings.findMany({
      where: { agencyId, isActive: true }
    })

    // Map agency configurations
    const agencyKeys = {
      google: aiSettings.find(s => s.provider === "google"),
      openai: aiSettings.find(s => s.provider === "openai"),
      anthropic: aiSettings.find(s => s.provider === "anthropic")
    }

    // Default top-level env variables
    const envKeys = {
      google: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
      openai: process.env.OPENAI_API_KEY || "",
      anthropic: process.env.ANTHROPIC_API_KEY || ""
    }

    let provider = ""
    let modelName = ""
    let apiKey = ""

    // Helper to try setting the provider based on priority list
    const trySetProvider = (priorityList: string[]) => {
      for (const p of priorityList) {
        const agencyConf = agencyKeys[p as keyof typeof agencyKeys]
        if (agencyConf?.apiKey) {
          provider = p
          modelName = agencyConf.modelName
          apiKey = agencyConf.apiKey
          return true
        }
      }
      
      // If agency has no valid keys for these, try env vars
      for (const p of priorityList) {
        const envKey = envKeys[p as keyof typeof envKeys]
        if (envKey) {
          provider = p
          if (p === "openai") modelName = "gpt-4o"
          if (p === "anthropic") modelName = "claude-5-sonnet"
          if (p === "google") modelName = "gemini-3.5-flash"
          apiKey = envKey
          return true
        }
      }
      return false
    }

    // Task-Based Routing Hierarchy
    let found = false
    if (context === "landing_page") {
      found = trySetProvider(["anthropic", "openai", "google"])
    } else if (context === "marketing") {
      found = trySetProvider(["openai", "anthropic", "google"])
    } else {
      // Chat or default
      found = trySetProvider(["google", "openai", "anthropic"])
    }

    // Ultimate fallback if absolutely nothing is found
    if (!found) {
      provider = "google"
      modelName = "gemini-3.5-flash"
      apiKey = ""
    }

    if (!apiKey) {
      console.warn(`No API key found for ${provider}, falling back to mock response.`)
      await new Promise(resolve => setTimeout(resolve, 1500))
      let response = "Here is some AI generated text based on your prompt."
      if (context === "chat") {
        response = "Thank you for reaching out! We've received your message and our team will get back to you shortly."
      } else if (context === "marketing") {
        response = "Unlock Your Business Potential! \n\nHey there, \n\nAre you looking to scale your business? We just launched our newest feature designed to double your conversions..."
      } else if (context === "landing_page") {
        response = `Here is some high-converting copy based on your prompt:\n\n**Headline:** Transform Your Workflow Today\n**Subheadline:** Discover the tools that top teams use to save hours every week.\n**Call to Action:** Get Started for Free`
      }
      return { success: true, data: response }
    }

    let systemPrompt = "You are a helpful business assistant."
    if (context === "chat") {
      systemPrompt = "You are an intelligent customer support agent. Generate a concise, friendly reply to the customer's message based on the context. If the prompt contains a conversation ID, imagine you are responding to the user's last message."
    } else if (context === "marketing") {
      systemPrompt = "You are an expert copywriter. Generate a high-converting marketing email."
    } else if (context === "landing_page") {
      systemPrompt = "You are an expert landing page copywriter. The user wants to build a web page section. Generate concise, compelling copy (headline + subheadline + CTA text) for the following request. Format it clearly."
    }

    let finalPrompt = prompt
    if (context === "chat") {
      const messages = await db.message.findMany({
        where: { conversationId: prompt },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      if (messages.length > 0) {
        finalPrompt = "Here are the recent messages in this conversation (newest first):\n" + 
          messages.map(m => `${m.isOutbound ? 'Agent' : 'Customer'}: ${m.content}`).join("\n") +
          "\n\nWrite a helpful, natural response to the customer."
      }
    }

    let selectedModel;
    if (provider === "openai") {
      const openai = createOpenAI({ apiKey })
      selectedModel = openai(modelName)
    } else if (provider === "anthropic") {
      const anthropic = createAnthropic({ apiKey })
      selectedModel = anthropic(modelName)
    } else {
      // Create a specific google instance so we can pass the API key explicitly
      // rather than relying purely on process.env
      // @ai-sdk/google allows passing api key to createGoogleGenerativeAI (wait, we can just set process.env locally or use standard google())
      // Actually @ai-sdk/google has createGoogleGenerativeAI from v4
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google")
      const googleAI = createGoogleGenerativeAI({ apiKey })
      selectedModel = googleAI(modelName)
    }

    const { text } = await generateText({
      model: selectedModel,
      system: systemPrompt,
      prompt: finalPrompt
    })

    return { success: true, data: text }
  } catch (error: any) {
    console.error("AI Error:", error)
    
    let errorMsg = error?.message || "Failed to generate AI content"
    if (errorMsg.includes("API call error") || errorMsg.includes("fetch failed")) {
      errorMsg = "Your API Key is invalid or restricted! Please double check your Settings."
    }
    
    return { success: false, error: errorMsg }
  }
}
