export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import MarketplaceClient from "./MarketplaceClient"

export default async function MarketplacePage() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch extensions and installs
  let extensions = await db.extension.findMany()
  
  if (extensions.length === 0) {
    const mockExtensions = [
      {
        name: "Stripe Sync",
        description: "Deeply integrate Stripe payments and subscriptions into Nexlin CRM.",
        manifest: "{}",
        version: "2.1.0"
      },
      {
        name: "ElevenLabs Voice Agents",
        description: "Deploy ultra-realistic AI voice agents for inbound and outbound calling.",
        manifest: "{}",
        version: "1.0.5"
      },
      {
        name: "Twilio Connect",
        description: "Send automated SMS and handle A2P 10DLC compliance automatically.",
        manifest: "{}",
        version: "3.4.1"
      },
      {
        name: "OpenAI Workflow Copilot",
        description: "Bring GPT-4 directly into your pipeline automations and chat inbox.",
        manifest: "{}",
        version: "1.2.0"
      }
    ]
    await db.extension.createMany({ data: mockExtensions })
    extensions = await db.extension.findMany()
  }
  
  const { getOrCreateAgency } = await import("@/app/actions/agency")
  const agencyId = await getOrCreateAgency()
  
  const installs = await db.extensionInstall.findMany({
    where: { agencyId: agencyId }
  })

  return <MarketplaceClient 
    initialExtensions={extensions} 
    initialInstalls={installs} 
    agencyId={agencyId} 
  />
}

