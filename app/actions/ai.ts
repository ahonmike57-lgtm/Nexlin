"use server"

import { getSession } from "@/lib/auth"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { db } from "@/lib/db"
import { getOrCreateAgency } from "./agency"
import { decryptConfig } from "@/lib/encryption"

// Model normalization mapping to handle legacy or informal model names
const MODEL_ALIASES: Record<string, string> = {
  // Anthropic
  "claude-5-sonnet": "claude-3-5-sonnet-20241022",
  "claude-5-opus": "claude-3-opus-20240229",
  "claude-4-5-haiku": "claude-3-5-haiku-20241022",
  "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
  "claude-3-haiku": "claude-3-5-haiku-20241022",
  // Google
  "gemini-3.5-flash": "gemini-2.0-flash",
  "gemini-3.1-pro": "gemini-1.5-pro",
  "gemini-2-flash": "gemini-2.0-flash",
  "gemini-flash": "gemini-2.0-flash",
  "gemini-pro": "gemini-1.5-pro"
}

function normalizeModelName(rawModel: string): string {
  if (!rawModel) return ""
  return MODEL_ALIASES[rawModel.toLowerCase().trim()] || rawModel
}

export async function generateAiReply(context: string, prompt: string, requestedProviderAndModel?: string) {
  try {
    const session = await getSession().catch(() => null)
    const agencyId = (session?.user as any)?.agencyId || await getOrCreateAgency()

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

    const cleanKey = (k: string | undefined) => {
      if (!k) return ""
      if (k === "1234567890" || k.includes("your-") || k.includes("YOUR_") || k === "placeholder") return ""
      return k.trim()
    }

    // Default top-level env variables (support both GOOGLE_GENERATIVE_AI_API_KEY and GEMINI_API_KEY)
    const envKeys = {
      google: cleanKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY),
      openai: cleanKey(process.env.OPENAI_API_KEY),
      anthropic: cleanKey(process.env.ANTHROPIC_API_KEY)
    }

    let provider = ""
    let modelName = ""
    let apiKey = ""

    // Helper to safely decrypt agency key or fallback to raw
    const getDecryptedKey = (rawKey: string): string => {
      try {
        return decryptConfig(rawKey)
      } catch {
        return rawKey
      }
    }

    // Helper to try setting the provider based on priority list
    const trySetProvider = (priorityList: string[]) => {
      // 1. Try Agency-configured keys
      for (const p of priorityList) {
        const agencyConf = agencyKeys[p as keyof typeof agencyKeys]
        if (agencyConf?.apiKey) {
          provider = p
          modelName = normalizeModelName(agencyConf.modelName)
          apiKey = getDecryptedKey(agencyConf.apiKey)
          return true
        }
      }
      
      // 2. Fallback to server Environment Variables
      for (const p of priorityList) {
        const envKey = envKeys[p as keyof typeof envKeys]
        if (envKey) {
          provider = p
          if (p === "openai") modelName = "gpt-4o"
          if (p === "anthropic") modelName = "claude-3-5-sonnet-20241022"
          if (p === "google") modelName = "gemini-2.0-flash"
          apiKey = envKey
          return true
        }
      }
      return false
    }

    let found = false

    // Explicit Provider / Model Request Override
    if (requestedProviderAndModel) {
      const parts = requestedProviderAndModel.split(":")
      const reqProvider = parts[0]?.toLowerCase().trim()
      const reqModel = parts[1]?.trim()

      if (reqProvider && ["openai", "anthropic", "google"].includes(reqProvider)) {
        const agencyConf = agencyKeys[reqProvider as keyof typeof agencyKeys]
        const envKey = envKeys[reqProvider as keyof typeof envKeys]
        
        if (agencyConf?.apiKey) {
          provider = reqProvider
          modelName = reqModel ? normalizeModelName(reqModel) : normalizeModelName(agencyConf.modelName)
          apiKey = getDecryptedKey(agencyConf.apiKey)
          found = true
        } else if (envKey) {
          provider = reqProvider
          modelName = reqModel ? normalizeModelName(reqModel) : (
            reqProvider === "openai" ? "gpt-4o" :
            reqProvider === "anthropic" ? "claude-3-5-sonnet-20241022" : "gemini-2.0-flash"
          )
          apiKey = envKey
          found = true
        }
      }
    }

    // Task-Based Routing Hierarchy (if not overridden)
    if (!found) {
      if (context === "landing_page" || context === "deal_insights" || context === "workflow_generator" || context === "form_generator" || context === "field_optimizer" || context === "snapshot_generator") {
        found = trySetProvider(["anthropic", "openai", "google"])
      } else if (context === "marketing" || context === "sales_coach" || context === "lead_enrichment") {
        found = trySetProvider(["openai", "anthropic", "google"])
      } else {
        // Chat, voice simulator, forge or default
        found = trySetProvider(["google", "openai", "anthropic"])
      }
    }

    // Ultimate fallback if absolutely nothing is configured
    if (!found) {
      provider = "google"
      modelName = "gemini-2.0-flash"
      apiKey = ""
    }

    if (!apiKey) {
      console.warn(`No API key found for ${provider}, falling back to mock response.`)
      await new Promise(resolve => setTimeout(resolve, 800))
      let response = "Here is some AI generated text based on your prompt."
      if (context === "chat") {
        response = "Thank you for reaching out! We've received your message and our team will get back to you shortly."
      } else if (context === "marketing") {
        response = "Unlock Your Business Potential! \n\nHey there, \n\nAre you looking to scale your business? We just launched our newest feature designed to double your conversions..."
      } else if (context === "landing_page") {
        response = `Here is some high-converting copy based on your prompt:\n\n**Headline:** Transform Your Workflow Today\n**Subheadline:** Discover the tools that top teams use to save hours every week.\n**Call to Action:** Get Started for Free`
      } else if (context === "sales_coach") {
        response = JSON.stringify({
          objectionScore: 88,
          valuePropScore: 85,
          closingScore: 82,
          overallScore: 85,
          grade: "A-",
          executiveSummary: "Strong presentation of ROI and platform capabilities. Rep maintained consultative tone throughout.",
          keyStrengths: ["Clear differentiation against legacy tools", "Active listening on integration bottlenecks"],
          actionableTips: ["Tighten closing call-to-action", "Anchor pricing earlier in the qualification stage"]
        })
      } else if (context === "lead_enrichment") {
        response = JSON.stringify({
          companyName: "Acme Corp",
          domain: "acme.com",
          industry: "B2B SaaS / Growth Tech",
          employeeRange: "50 - 200 Employees",
          estimatedRevenue: "$5M - $20M ARR",
          techStack: ["Next.js", "Stripe", "PostgreSQL", "Twilio", "AWS"],
          buyerPersona: "VP of Revenue Operations",
          keyPainPoints: ["High churn during manual onboarding", "Disconnected CRM and voice tools"],
          suggestedPitch: "Consolidate omnichannel CRM, voice automation, and automated funnel tracking into a unified pipeline."
        })
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
    } else if (context === "deal_insights") {
      systemPrompt = "You are an expert CRM sales manager AI. Analyze the provided deal and conversation history. Return ONLY a raw JSON object with the following structure: {\"winProbability\": number (0-100), \"summary\": \"string summarizing the relationship\", \"nextAction\": \"string describing the best next action to close the deal\"}. Do not wrap the JSON in markdown code blocks."
    } else if (context === "sales_coach") {
      systemPrompt = "You are an executive VP of Sales and master sales coach. Evaluate roleplay sessions with objective scoring, actionable feedback, and closing strategies. Return strictly valid JSON."
    } else if (context === "lead_enrichment") {
      systemPrompt = "You are an expert B2B firmographics and market intelligence specialist. Analyze the contact and company data and return strictly valid JSON containing company details, tech stack, pain points, and pitch hooks."
    } else if (context === "forge") {
      systemPrompt = "You are Forge AI, an elite Full-Stack Web Designer and Funnel Conversion Architect. Generate high-performance UI sections, compelling marketing copy, and SEO metadata. Return concise JSON or structured content per the requested task."
    } else if (context === "snapshot_generator") {
      systemPrompt = "You are an enterprise CRM architect. Generate structured, multi-stage pipelines, funnels, and automated nurture sequences in strictly valid JSON format."
    } else if (context === "workflow_generator") {
      systemPrompt = `You are an expert Automation Architect. The user will describe a workflow they want. 
You must translate their prompt into a strict JSON object with this exact structure:
{
  "name": "A short, descriptive name for the workflow",
  "trigger": "one of: contact_created, tag_added, deal_won, form_submitted",
  "actions": [
    { "type": "one of: send_email, add_tag, wait, send_sms, create_task" },
    ...
  ]
}
RULES:
1. ONLY return the raw JSON object. NO markdown, NO backticks.
2. You MUST pick exactly ONE trigger. If they don't specify one, default to "contact_created".
3. You can have multiple actions.
4. ONLY use the exact trigger and action string literals provided above. Do not invent new types.`
    } else if (context === "form_generator") {
      systemPrompt = `You are an expert Lead Generation Consultant. The user will describe their business and the goal of their form.
You must generate a sequence of form fields to perfectly capture this lead. 
Return a strict JSON array of objects with this structure:
[
  { "type": "text", "label": "Full Name", "required": true },
  { "type": "email", "label": "Best Email Address", "required": true },
  ...
]
Allowed field types: "text", "email", "tel", "textarea".
RULES:
1. ONLY return the raw JSON array. NO markdown, NO backticks.
2. Keep the form to 3-6 highly relevant fields to maximize conversion.
3. Make the labels conversational and engaging.`
    } else if (context === "field_optimizer") {
      systemPrompt = "You are a conversion-rate optimization expert. The user will give you a standard form field label (e.g., 'Email Address'). You must rewrite it to be a high-converting, conversational question (e.g., 'Where should we send your free quote?'). Return ONLY the rewritten string, nothing else. No quotes."
    }

    let finalPrompt = prompt
    if (context === "chat") {
      const messages = await db.message.findMany({
        where: { conversationId: prompt },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      
      const conv = await db.conversation.findUnique({
        where: { id: prompt },
        include: { contact: true, agency: true }
      })

      const knowledgeArticles = conv ? await db.knowledgeArticle.findMany({
        where: { agencyId: conv.agencyId }
      }) : []

      let kbContext = ""
      if (knowledgeArticles.length > 0) {
        kbContext = "Agency Knowledge Base:\n" + knowledgeArticles.map((k: any) => `Q: ${k.title}\nA: ${k.content}`).join("\n\n") + "\n\n"
      }

      let crmContext = ""
      if (conv?.contact) {
        crmContext = `Customer Context:\nName: ${conv.contact.firstName} ${conv.contact.lastName || ""}\nEmail: ${conv.contact.email || "N/A"}\nLead Score: ${conv.contact.leadScore || 0}\n\n`
      }

      if (messages.length > 0) {
        finalPrompt = `Goal: You are the autonomous AI Sales SDR. Answer questions using the Knowledge Base. Try to move the conversation forward towards booking an appointment. Keep responses brief, conversational, and SMS-friendly (under 160 chars if possible).\n\n${crmContext}${kbContext}Recent Conversation History (newest first):\n` + 
          messages.map((m: any) => `${m.isOutbound ? 'AI SDR' : 'Customer'}: ${m.content}`).join("\n") +
          "\n\nWrite a helpful, natural response to the Customer as the AI SDR."
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

    const { text, usage } = await generateText({
      model: selectedModel,
      system: systemPrompt,
      prompt: finalPrompt
    })

    // Deduct AI Token Usage
    if (usage && usage.totalTokens) {
      const { deductUsage } = await import("./saas")
      await deductUsage(agencyId, (session?.user as any)?.subAgencyId || null, "ai_tokens", usage.totalTokens).catch(() => {})
    }

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
