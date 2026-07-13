import { db } from '@/lib/db'
import McpClient from './McpClient'

export default async function McpPage() {
  const agencyId = 'cluz12345000008l412345678' // mock agency ID, like in other pages

  const connections = await db.mcpConnection.findMany({
    where: { agencyId },
    orderBy: { createdAt: 'desc' }
  });

  return <McpClient connections={connections} agencyId={agencyId} />
}
