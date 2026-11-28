import "server-only"
import { db } from "./db"
import { decryptConfig } from "./encryption"
import { assertSafeOutboundUrl } from "./ssrf"

// Interfaces for standard MCP server responses
export interface McpTool {
  name: string
  description: string
  schema?: any // JSON schema for arguments
}

export interface McpToolResult {
  success: boolean
  data?: any
  error?: string
}

const VALID_TOOL_NAME = /^[a-zA-Z0-9_.-]{1,128}$/

/**
 * Fetches available tools from an external MCP server owned by `agencyId`.
 */
export async function listMcpTools(connectionId: string, agencyId: string): Promise<McpTool[]> {
  if (!agencyId) throw new Error("Agency ID is required")

  const connection = await db.mcpConnection.findFirst({
    where: { id: connectionId, agencyId },
  })

  if (!connection) throw new Error("MCP Connection not found")

  const baseUrl = assertSafeOutboundUrl(connection.serverUrl).toString().replace(/\/+$/, "")

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (connection.encryptedCredentials) {
    const token = decryptConfig(connection.encryptedCredentials)
    if (!token) {
      throw new Error("Failed to decrypt MCP connection credentials")
    }
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${baseUrl}/tools`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`Failed to list tools: ${response.statusText}`)
  }

  const data = await response.json()
  return data.tools || []
}

/**
 * Invokes a specific tool on an external MCP server owned by `agencyId`.
 */
export async function callMcpTool(
  connectionId: string,
  agencyId: string,
  toolName: string,
  args: Record<string, any>
): Promise<McpToolResult> {
  if (!agencyId) throw new Error("Agency ID is required")
  if (!VALID_TOOL_NAME.test(toolName)) {
    throw new Error("Invalid MCP tool name")
  }

  const connection = await db.mcpConnection.findFirst({
    where: { id: connectionId, agencyId },
  })

  if (!connection) throw new Error("MCP Connection not found")

  const baseUrl = assertSafeOutboundUrl(connection.serverUrl).toString().replace(/\/+$/, "")

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (connection.encryptedCredentials) {
    const token = decryptConfig(connection.encryptedCredentials)
    if (!token) {
      return { success: false, error: "Failed to decrypt MCP connection credentials" }
    }
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${baseUrl}/invoke/${encodeURIComponent(toolName)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ args }),
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    return {
      success: false,
      error: `Invocation failed with status ${response.status}`,
    }
  }

  const data = await response.json()
  return {
    success: true,
    data,
  }
}
