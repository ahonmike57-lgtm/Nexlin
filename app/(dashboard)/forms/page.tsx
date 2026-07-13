import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db as prisma } from "@/lib/db"
import { getForms } from "@/app/actions/forms"
import FormsClient from "./FormsClient"
import { redirect } from "next/navigation"

export default async function FormsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { agencyId: true }
  })

  if (!user?.agencyId) redirect("/onboarding")

  const res = await getForms(user.agencyId)
  let initialForms = res.success && res.forms ? res.forms : []

  // Mock some data if empty
  if (initialForms.length === 0) {
    initialForms = [
      {
        id: "mock-1",
        agencyId: user.agencyId,
        name: "Lead Capture Form",
        fields: "[]",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { submissions: 14 }
      },
      {
        id: "mock-2",
        agencyId: user.agencyId,
        name: "Customer Survey",
        fields: "[]",
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 5),
        updatedAt: new Date(Date.now() - 86400000 * 5),
        _count: { submissions: 42 }
      }
    ] as any
  }

  return <FormsClient initialForms={initialForms} agencyId={user.agencyId} />
}
