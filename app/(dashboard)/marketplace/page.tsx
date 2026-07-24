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

  // Fetch apps and tenant installs
  let apps = await db.app.findMany()
  
  if (apps.length === 0) {
    const mockApps = [
      {
        id: "stripe-sync",
        name: "Stripe Sync",
        category: "Payments",
        description: "Deeply integrate Stripe payments and subscriptions into Nexlin CRM.",
        installType: "oauth",
        configSchema: "{}",
      },
      {
        id: "elevenlabs-voice",
        name: "ElevenLabs Voice Agents",
        category: "AI",
        description: "Deploy ultra-realistic AI voice agents for inbound and outbound calling.",
        installType: "apikey",
        configSchema: "{}",
      },
      {
        id: "twilio-connect",
        name: "Twilio Connect",
        category: "Communication",
        description: "Send automated SMS and handle A2P 10DLC compliance automatically.",
        installType: "apikey",
        configSchema: "{}",
      },
      {
        id: "openai-copilot",
        name: "OpenAI Workflow Copilot",
        category: "AI",
        description: "Bring GPT-4 directly into your pipeline automations and chat inbox.",
        installType: "apikey",
        configSchema: "{}",
      }
    ]
    await db.app.createMany({ data: mockApps })
    apps = await db.app.findMany()
  }
  
  const { getOrCreateAgency } = await import("@/app/actions/agency")
  const agencyId = await getOrCreateAgency()
  
  const installs = await db.tenantApp.findMany({
    where: { agencyId: agencyId }
  })

  return <MarketplaceClient 
    initialApps={apps} 
    initialInstalls={installs} 
    agencyId={agencyId} 
  />
}

