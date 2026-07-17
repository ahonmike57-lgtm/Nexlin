export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import { db } from "@/lib/db"
import SubAccountsClient from "./SubAccountsClient"

export default async function SubAccountsPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const subAccounts = await db.subAgency.findMany({
    where: { agencyId },
    orderBy: { createdAt: "desc" }
  })

  return <SubAccountsClient initialSubAccounts={subAccounts} agencyId={agencyId} />
}
