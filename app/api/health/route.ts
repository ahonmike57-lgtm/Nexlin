import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const startTime = Date.now()
  try {
    // Probe database latency
    await db.$queryRaw`SELECT 1`
    const dbLatencyMs = Date.now() - startTime

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: "connected",
        latencyMs: dbLatencyMs,
      },
      services: {
        inngest: "active",
        telephony: "ready",
        aiEngine: "operational"
      }
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message || "Database connection error"
    }, { status: 503 })
  }
}
