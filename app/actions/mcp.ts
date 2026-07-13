'use server'

import { db } from '@/lib/db'
import { encrypt } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import { listMcpTools } from '@/lib/mcp'

export async function getMcpConnections(agencyId: string) {
  try {
    const connections = await db.mcpConnection.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' }
    });
    // Never return the encryptedCredentials to the client
    return {
      success: true,
      connections: connections.map(({ encryptedCredentials, ...rest }) => rest)
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addMcpConnection(agencyId: string, data: { name: string, serverUrl: string, apiKey: string }) {
  try {
    const encryptedCredentials = data.apiKey ? encrypt(data.apiKey) : null;
    const connection = await db.mcpConnection.create({
      data: {
        agencyId,
        name: data.name,
        serverUrl: data.serverUrl,
        encryptedCredentials,
      }
    });
    
    // Audit log
    await db.extensionAuditLog.create({
      data: {
        agencyId,
        action: 'MCP_ADD_CONNECTION',
        details: JSON.stringify({ name: data.name, serverUrl: data.serverUrl }),
      }
    });

    revalidatePath('/settings/mcp');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMcpConnection(connectionId: string, agencyId: string) {
  try {
    const connection = await db.mcpConnection.findUnique({
      where: { id: connectionId }
    });

    if (connection?.agencyId !== agencyId) {
      throw new Error("Unauthorized");
    }

    await db.mcpConnection.delete({
      where: { id: connectionId }
    });
    
    await db.extensionAuditLog.create({
      data: {
        agencyId,
        action: 'MCP_DELETE_CONNECTION',
        details: JSON.stringify({ connectionId }),
      }
    });

    revalidatePath('/settings/mcp');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function testMcpConnection(connectionId: string, agencyId: string) {
  try {
    const connection = await db.mcpConnection.findUnique({
      where: { id: connectionId }
    });

    if (connection?.agencyId !== agencyId) {
      throw new Error("Unauthorized");
    }

    // Try to list tools
    const tools = await listMcpTools(connectionId);
    return { success: true, tools };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
