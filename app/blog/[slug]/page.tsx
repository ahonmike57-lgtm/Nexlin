import { notFound } from "next/navigation"
import { getPublicBlogPost } from "@/app/actions/blogs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, User, Globe } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublicBlogPost(slug)
  if (!post) {
    return { title: "Article Not Found | Nexlin" }
  }
  return {
    title: `${post.title} | ${post.agencyName}`,
    description: post.summary || `Read ${post.title} on ${post.agencyName}.`
  }
}

export default async function PublicBlogPage({ params }: Props) {
  const { slug } = await params
  const post = await getPublicBlogPost(slug)

  if (!post) {
    notFound()
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Top Banner */}
      <header className="border-b border-border bg-bg-secondary/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
            <span className="text-text-secondary">/</span>
            <span className="text-xs font-medium text-text-secondary flex items-center gap-1">
              <Globe className="w-3 h-3 text-primary" /> {post.agencyName}
            </span>
          </div>

          <Badge variant="outline" className="text-xs font-medium bg-primary/10 text-primary border-primary/20">
            {post.blogCategory || "Articles"}
          </Badge>
        </div>
      </header>

      {/* Main Article Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <article className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary leading-[1.15]">
              {post.title}
            </h1>

            {post.summary && (
              <p className="text-lg text-text-secondary leading-relaxed font-normal">
                {post.summary}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-text-secondary pt-2 border-t border-border">
              <span className="flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-primary" />
                {post.author || post.agencyName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Article Body */}
          <div className="prose dark:prose-invert max-w-none text-text-primary text-base leading-relaxed whitespace-pre-wrap font-sans pt-4 border-t border-border">
            {post.content}
          </div>

          {/* Article Footer */}
          <div className="p-6 rounded-2xl bg-bg-secondary/40 border border-border mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-text-primary">Published by {post.agencyName}</h4>
              <p className="text-xs text-text-secondary mt-0.5">Powered by Nexlin Client Experience Engine</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-md hover:bg-primary/90 transition-all"
            >
              Explore {post.agencyName}
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
