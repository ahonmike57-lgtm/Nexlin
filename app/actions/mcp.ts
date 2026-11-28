'use server'

import { db } from '@/lib/db'
import { encryptConfig } from '@/lib/encryption'
import { requireTenantAuth } from '@/lib/permissions'
import { assertSafeOutboundUrl } from '@/lib/ssrf'
import { revalidatePath } from 'next/cache'
import { listMcpTools } from '@/lib/mcp'

export async function getMcpConnections() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const connections = await db.mcpConnection.findMany({
      where: { agencyId: auth.agencyId },
      orderBy: { createdAt: 'desc' }
    });
    return {
      success: true,
      connections: connections.map(({ encryptedCredentials, ...rest }) => rest)
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addMcpConnection(data: { name: string, serverUrl: string, apiKey: string }) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const safeUrl = assertSafeOutboundUrl(data.serverUrl.trim()).toString().replace(/\/+$/, '');
    const encryptedCredentials = data.apiKey ? encryptConfig(data.apiKey) : null;
    const connection = await db.mcpConnection.create({
      data: {
        agencyId: auth.agencyId,
        name: data.name.trim(),
        serverUrl: safeUrl,
        encryptedCredentials,
      }
    });

    revalidatePath('/settings/mcp');
    const { encryptedCredentials: _enc, ...safeConnection } = connection;
    return { success: true, connection: safeConnection };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMcpConnection(connectionId: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    await db.mcpConnection.deleteMany({
      where: { id: connectionId, agencyId: auth.agencyId }
    });

    revalidatePath('/settings/mcp');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function testMcpConnection(connectionId: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const connection = await db.mcpConnection.findFirst({
      where: { id: connectionId, agencyId: auth.agencyId }
    });

    if (!connection) throw new Error("MCP Connection not found");

    const tools = await listMcpTools(connection.id, auth.agencyId);
    return { success: true, tools };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
