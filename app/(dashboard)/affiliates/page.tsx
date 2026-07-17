import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { db as prisma } from "@/lib/db"
import AffiliatesClient from "./AffiliatesClient"

export default async function AffiliatesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user || !user.agencyId) {
    return <div>Agency access required.</div>
  }

  return <AffiliatesClient agencyId={user.agencyId} />
}
