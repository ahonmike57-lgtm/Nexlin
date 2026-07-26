export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMcpConnections } from "@/app/actions/mcp"
import McpClient from "./McpClient"

export default async function McpPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const res = await getMcpConnections()
  const connections = res.success && res.connections ? res.connections : []

  return <McpClient initialConnections={connections} />
}
