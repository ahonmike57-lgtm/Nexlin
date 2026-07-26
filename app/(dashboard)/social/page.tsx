export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import SocialClient from "./SocialClient"
import { getSocialAccounts, getSocialPosts } from "@/app/actions/social"

export default async function SocialPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const accountsRes = await getSocialAccounts()
  const postsRes = await getSocialPosts()

  const initialAccounts = accountsRes.success && accountsRes.accounts ? accountsRes.accounts : []
  const initialPosts = postsRes.success && postsRes.posts ? postsRes.posts : []

  return <SocialClient initialAccounts={initialAccounts} initialPosts={initialPosts} />
}
