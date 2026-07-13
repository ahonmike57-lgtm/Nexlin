import { decrypt } from './crypto';
import { db } from './db';

// Interfaces for standard MCP server responses
export interface McpTool {
  name: string;
  description: string;
  schema?: any; // JSON schema for arguments
}

export interface McpToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Fetches available tools from an external MCP server
 */
export async function listMcpTools(connectionId: string): Promise<McpTool[]> {
  const connection = await db.mcpConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection) throw new Error('MCP Connection not found');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (connection.encryptedCredentials) {
    const token = decrypt(connection.encryptedCredentials);
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Expecting the standard /tools endpoint (or a mock one for now)
  const response = await fetch(`${connection.serverUrl}/tools`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to list tools: ${response.statusText}`);
  }

  const data = await response.json();
  return data.tools || [];
}

/**
 * Invokes a specific tool on an external MCP server
 */
export async function callMcpTool(
  connectionId: string, 
  toolName: string, 
  args: Record<string, any>
): Promise<McpToolResult> {
  const connection = await db.mcpConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection) throw new Error('MCP Connection not found');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (connection.encryptedCredentials) {
    const token = decrypt(connection.encryptedCredentials);
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${connection.serverUrl}/invoke/${toolName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ args })
  });

  if (!response.ok) {
    return {
      success: false,
      error: `Invocation failed with status ${response.status}`
    };
  }

  const data = await response.json();
  return {
    success: true,
    data
  };
}
