import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const startTime = Date.now()
  try {
    // Probe database latency
    await db.$queryRaw`SELECT 1`
    const dbLatencyMs = Date.now() - startTime

    const hasAiKey = Boolean(
      (
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.ANTHROPIC_API_KEY
      )?.trim()
    )

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: "connected",
          latencyMs: dbLatencyMs,
        },
        services: {
          inngest: process.env.INNGEST_EVENT_KEY?.trim() ? "configured" : "unconfigured",
          telephony:
            process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim()
              ? "configured"
              : "unconfigured",
          email: process.env.RESEND_API_KEY?.trim() ? "configured" : "unconfigured",
          aiEngine: hasAiKey ? "configured" : "unconfigured",
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Health check database probe failed:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection error",
      },
      { status: 503 }
    )
  }
}
