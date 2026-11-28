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

const DEFAULT_MODEL_REGISTRY: Record<ForgeTaskType, { primary: string; fallback: string }> = {
  layout_generation: { primary: "claude-3-5-sonnet-20241022", fallback: "gpt-4o" },
  copywriting: { primary: "claude-3-5-sonnet-20241022", fallback: "gpt-4o-mini" },
  image_generation: { primary: "flux-1-dev", fallback: "dall-e-3" },
  design_critique: { primary: "gpt-4o", fallback: "claude-3-5-sonnet-20241022" },
  seo_metadata: { primary: "gpt-4o-mini", fallback: "claude-3-5-haiku-20241022" },
}

export async function generateForgeTask(
  taskType: ForgeTaskType,
  context: ForgeTaskContext
): Promise<ForgeTaskResult> {
  const startTime = Date.now()
  const routing = DEFAULT_MODEL_REGISTRY[taskType] || {
    primary: "claude-3-5-sonnet-20241022",
    fallback: "gpt-4o",
  }

  const modelUsed = routing.primary
  const costEstimate = 0.004

  try {
    const promptPayload = `Task: ${taskType}\nVertical: ${context.vertical || "general"}\n${context.prompt}`
    const res = await generateAiReply("forge", promptPayload)

    const latencyMs = Date.now() - startTime

    if (!res.success || !res.data) {
      return {
        success: false,
        taskType,
        modelUsed,
        output: null,
        latencyMs,
        costUsd: 0,
        error: res.error || "AI generation unavailable. Configure an AI key in Settings -> AI.",
      }
    }

    let parsedOutput: any = res.data
    try {
      const cleaned = res.data.replace(/```json/gi, "").replace(/```/g, "").trim()
      parsedOutput = JSON.parse(cleaned)
    } catch {
      parsedOutput = res.data
    }

    try {
      await db.forgeGeneration.create({
        data: {
          pageId: context.pageId || undefined,
          prompt: context.prompt.slice(0, 1000),
          taskType,
          modelUsed,
          outputRef:
            typeof parsedOutput === "string"
              ? parsedOutput.slice(0, 500)
              : JSON.stringify(parsedOutput).slice(0, 500),
          latencyMs,
          costUsd: costEstimate,
          qualityScore: 1.0,
        },
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
      costUsd: costEstimate,
    }
  } catch (error: any) {
    const latencyMs = Date.now() - startTime
    return {
      success: false,
      taskType,
      modelUsed,
      output: null,
      latencyMs,
      costUsd: 0,
      error: error?.message || "Forge AI task failed",
    }
  }
}
