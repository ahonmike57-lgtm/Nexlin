export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { getForms } from "@/app/actions/forms"
import { getOrCreateAgency } from "@/app/actions/agency"
import FormsClient from "./FormsClient"
import { redirect } from "next/navigation"

export default async function FormsPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()

  const res = await getForms(agencyId)
  let initialForms = res.success && res.data ? res.data : []

  // Mock some data if empty
  if (initialForms.length === 0) {
    initialForms = [
      {
        id: "mock-1",
        agencyId: agencyId,
        name: "Lead Capture Form",
        fields: "[]",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { submissions: 14 }
      },
      {
        id: "mock-2",
        agencyId: agencyId,
        name: "Customer Survey",
        fields: "[]",
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 5),
        updatedAt: new Date(Date.now() - 86400000 * 5),
        _count: { submissions: 42 }
      }
    ] as any
  }

  return <FormsClient initialForms={initialForms} agencyId={agencyId} />
}

