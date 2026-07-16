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
  const extensions = await db.extension.findMany()
  const installs = await db.extensionInstall.findMany({
    where: { agencyId: session.user.id }
  })

  return <MarketplaceClient 
    initialExtensions={extensions} 
    initialInstalls={installs} 
    agencyId={session.user.id} 
  />
}

