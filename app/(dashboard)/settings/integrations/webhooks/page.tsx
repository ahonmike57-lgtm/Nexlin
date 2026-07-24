import { db } from "@/lib/db"
import { getOrCreateAgency } from "@/app/actions/agency"
import WebhooksClient from "./WebhooksClient"

export default async function WebhooksPage() {
  const agencyId = await getOrCreateAgency()

  const webhooks = await db.webhook.findMany({
    where: { agencyId },
    orderBy: { createdAt: 'desc' }
  })

  return <WebhooksClient initialWebhooks={webhooks} agencyId={agencyId} />
}
