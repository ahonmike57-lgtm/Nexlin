export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import { db } from "@/lib/db"
import SubAccountsClient from "./SubAccountsClient"

import { getActiveSubAccountId } from "@/app/actions/subaccounts"

export default async function SubAccountsPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const activeSubAccountId = await getActiveSubAccountId()

  const subAccounts = await db.subAgency.findMany({
    where: { agencyId },
    include: {
      _count: {
        select: {
          contacts: true,
          deals: true,
          funnels: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <SubAccountsClient
      initialSubAccounts={subAccounts}
      agencyId={agencyId}
      activeSubAccountId={activeSubAccountId}
    />
  )
}
