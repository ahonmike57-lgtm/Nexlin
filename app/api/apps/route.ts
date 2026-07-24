import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")

    const whereClause = category ? { category, isActive: true } : { isActive: true }
    
    const apps = await db.app.findMany({
      where: whereClause,
      orderBy: { sortOrder: "asc" }
    })

    return NextResponse.json({ success: true, apps })
  } catch (error: any) {
    console.error("Failed to fetch apps:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
