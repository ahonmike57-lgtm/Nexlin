import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import SaasClient from "./SaasClient"
import { getRebillingMarkups, getAgencyWalletBalance } from "@/app/actions/saas"

export default async function SaasSettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.email) {
    redirect("/login")
  }

  // Get agency ID from user
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { agencyId: true }
  })

  if (!user || !user.agencyId) {
    redirect("/onboarding")
  }

  const markupsRes = await getRebillingMarkups(user.agencyId)
  const walletRes = await getAgencyWalletBalance(user.agencyId)

  return (
    <SaasClient 
      agencyId={user.agencyId} 
      initialMarkups={markupsRes.success ? markupsRes.markups : []}
      initialWallet={walletRes.success ? walletRes.wallet : null}
    />
  )
}
