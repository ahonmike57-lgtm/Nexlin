import { db } from "@/lib/db"
import { generateAiReply } from "@/app/actions/ai"

export type ForgeTaskType = 
  | "layout_generation" 
  | "copywriting" 
  | "image_generation" 
  | "design_critique" 
  | "seo_metadata"

export interface ForgeTaskContext {
  prompt: string
  pageId?: string
  vertical?: string
  currentComponents?: any[]
}

export interface ForgeTaskResult {
  success: boolean
  taskType: ForgeTaskType
  modelUsed: string
  output: any
  latencyMs: number
  costUsd: number
  error?: string
}

// Default Task Routing Table Configuration
const DEFAULT_MODEL_REGISTRY: Record<ForgeTaskType, { primary: string; fallback: string }> = {
  layout_generation: { primary: "claude-3-5-sonnet", fallback: "gpt-4o" },
  copywriting: { primary: "claude-3-5-sonnet", fallback: "gpt-4o-mini" },
  image_generation: { primary: "flux-1-dev", fallback: "dall-e-3" },
  design_critique: { primary: "gpt-4o-vision", fallback: "claude-3-5-sonnet" },
  seo_metadata: { primary: "gpt-4o-mini", fallback: "claude-3-haiku" }
}

export async function generateForgeTask(
  taskType: ForgeTaskType, 
  context: ForgeTaskContext
): Promise<ForgeTaskResult> {
  const startTime = Date.now()
  const routing = DEFAULT_MODEL_REGISTRY[taskType] || { primary: "claude-3-5-sonnet", fallback: "gpt-4o" }

  let modelUsed = routing.primary
  let outputRaw: string | null = null
  let costEstimate = 0.004

  try {
    // Primary Provider Execution Attempt
    const promptPayload = `Task: ${taskType}\nContext: ${context.prompt}\nVertical: ${context.vertical || 'general'}`
    const res = await generateAiReply("", promptPayload)

    if (res.success && res.data) {
      outputRaw = res.data
    } else {
      // Automatic Fallback Retry
      modelUsed = routing.fallback
      costEstimate = 0.002
      const fallbackRes = await generateAiReply("", promptPayload)
      if (fallbackRes.success && fallbackRes.data) {
        outputRaw = fallbackRes.data
      }
    }

    const latencyMs = Date.now() - startTime

    if (!outputRaw) {
      return {
        success: false,
        taskType,
        modelUsed,
        output: null,
        latencyMs,
        costUsd: costEstimate,
        error: "All model routing attempts failed"
      }
    }

    // Parse JSON for structured tasks
    let parsedOutput: any = outputRaw
    try {
      parsedOutput = JSON.parse(outputRaw.replace(/```json|```/g, "").trim())
    } catch {
      parsedOutput = outputRaw
    }

    // Telemetry Logging in ForgeGeneration
    try {
      await db.forgeGeneration.create({
        data: {
          pageId: context.pageId || undefined,
          prompt: context.prompt,
          taskType,
          modelUsed,
          outputRef: typeof parsedOutput === "string" ? parsedOutput.slice(0, 500) : JSON.stringify(parsedOutput).slice(0, 500),
          latencyMs,
          costUsd: costEstimate,
          qualityScore: 1.0
        }
      })
    } catch (e) {
      console.warn("Forge generation telemetry logging skipped:", e)
    }

    return {
      success: true,
      taskType,
      modelUsed,
      output: parsedOutput,
      latencyMs,
      costUsd: costEstimate
    }
  } catch (error: any) {
    const latencyMs = Date.now() - startTime
    return {
      success: false,
      taskType,
      modelUsed,
      output: null,
      latencyMs,
      costUsd: costEstimate,
      error: error.message
    }
  }
}
