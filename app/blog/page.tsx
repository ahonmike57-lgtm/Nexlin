import { getAllPublicBlogPosts } from "@/app/actions/blogs"
import BlogIndexClient from "./BlogIndexClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "The Nexlin Journal | AI Automation, CRM Engineering & Agency Growth",
  description: "Deep technical breakdowns, voice AI latency benchmarks, CPQ close-rate strategies, and operating architecture for high-growth digital agencies.",
  openGraph: {
    title: "The Nexlin Journal | Engineering & Growth",
    description: "Deep technical breakdowns and operator playbooks for modern digital agencies.",
    type: "website"
  }
}

export default async function BlogPage() {
  const posts = await getAllPublicBlogPosts()

  return <BlogIndexClient initialPosts={posts} />
}
