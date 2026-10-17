import { notFound } from "next/navigation"
import { getPublicBlogPost, getAllPublicBlogPosts } from "@/app/actions/blogs"
import SinglePostClient from "./SinglePostClient"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublicBlogPost(slug)
  if (!post) {
    return { title: "Article Not Found | The Nexlin Journal" }
  }
  return {
    title: `${post.title} | The Nexlin Journal`,
    description: post.summary || `Read ${post.title} on The Nexlin Journal.`,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      authors: [post.author]
    }
  }
}

export default async function PublicBlogPage({ params }: Props) {
  const { slug } = await params
  const post = await getPublicBlogPost(slug)

  if (!post) {
    notFound()
  }

  // Get other articles in same or other categories for related posts
  const allPosts = await getAllPublicBlogPosts()
  const relatedPosts = allPosts
    .filter(p => p.slug !== post.slug)
    .slice(0, 2)

  return <SinglePostClient post={post} relatedPosts={relatedPosts} />
}
