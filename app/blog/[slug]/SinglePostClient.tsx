"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Globe,
  Share2,
  Check,
  Copy,
  Bookmark,
  ArrowRight,
  Sparkles,
  BookOpen
} from "lucide-react"
import type { PublicBlogPost } from "@/app/actions/blogs"
import { toast } from "sonner"

export default function SinglePostClient({
  post,
  relatedPosts
}: {
  post: PublicBlogPost
  relatedPosts: PublicBlogPost[]
}) {
  const [copied, setCopied] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, progress)))
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success("Article link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareTwitter = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href)
      const text = encodeURIComponent(`"${post.title}" via @NexlinOS`)
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank")
    }
  }

  const handleShareLinkedIn = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href)
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank")
    }
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-primary/20 selection:text-primary">
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-500 z-50 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Banner & Breadcrumb Nav */}
      <header className="border-b border-border/80 bg-bg-primary/85 backdrop-blur-xl sticky top-0 z-40 transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-bg-secondary"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Articles</span>
            </Link>
            <span className="text-border hidden sm:inline">/</span>
            <span className="text-xs font-medium text-text-secondary hidden sm:flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-primary" /> {post.agencyName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Menu Buttons */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-border/60 transition"
              title="Copy Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleShareTwitter}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-border/60 transition"
              title="Share on X"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={handleShareLinkedIn}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-border/60 transition"
              title="Share on LinkedIn"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.55a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28" />
              </svg>
            </button>

            <Link href="/register">
              <Button size="sm" className="font-semibold text-xs h-8 px-3 ml-1 shadow-md shadow-primary/20">
                Try Nexlin Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Article Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <article className="space-y-10">
          {/* Article Header & Metadata */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/25 px-3 py-1">
                {post.blogCategory}
              </Badge>
              <span className="text-xs text-text-muted">•</span>
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-text-muted" /> {post.readTime}
              </span>
              <span className="text-xs text-text-muted">•</span>
              <span className="text-xs text-text-muted">{formattedDate}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.12]">
              {post.title}
            </h1>

            {post.summary && (
              <p className="text-lg sm:text-xl text-text-secondary leading-relaxed font-normal border-l-2 border-primary/50 pl-4 py-1">
                {post.summary}
              </p>
            )}

            {/* Author Byline Box */}
            <div className="flex items-center justify-between pt-4 pb-2 border-t border-b border-border/60 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                  {post.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-xs sm:text-sm">{post.author}</h4>
                  <p className="text-[11px] text-text-muted">{post.authorRole || post.agencyName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-secondary/70 hover:bg-bg-secondary text-text-secondary hover:text-text-primary text-xs font-medium transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Share"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key Takeaways Callout Box */}
          <div className="p-6 rounded-2xl bg-bg-card/70 border border-primary/20 shadow-md space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Key Executive Takeaway</span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Consolidating telephony, CPQ proposals, and omnichannel CRM automations eliminates data leakage, drops third-party SaaS expenditures by over $4,000/month, and enables autonomous response workflows that close high-ticket clients faster.
            </p>
          </div>

          {/* Article Body Content */}
          <div className="prose dark:prose-invert max-w-none text-text-primary text-base sm:text-lg leading-relaxed font-sans space-y-6">
            {post.content.split("\n\n").map((paragraph, idx) => {
              // Heading 3
              if (paragraph.startsWith("### ")) {
                return (
                  <h3 key={idx} className="text-2xl font-bold tracking-tight text-text-primary mt-8 mb-4">
                    {paragraph.replace("### ", "")}
                  </h3>
                )
              }
              // Heading 2
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={idx} className="text-3xl font-extrabold tracking-tight text-text-primary mt-10 mb-4">
                    {paragraph.replace("## ", "")}
                  </h2>
                )
              }
              // Code Block
              if (paragraph.startsWith("```") && paragraph.endsWith("```")) {
                const codeLines = paragraph.slice(3, -3).trim()
                return (
                  <pre key={idx} className="p-4 rounded-2xl bg-bg-secondary/90 border border-border overflow-x-auto text-xs font-mono text-emerald-400 my-6 shadow-inner">
                    <code>{codeLines}</code>
                  </pre>
                )
              }
              // Bulleted list item
              if (paragraph.startsWith("- ") || paragraph.startsWith("1. ")) {
                return (
                  <div key={idx} className="pl-4 border-l border-border/80 my-3 text-text-secondary text-base leading-relaxed whitespace-pre-line">
                    {paragraph}
                  </div>
                )
              }
              // Standard paragraph
              return (
                <p key={idx} className="text-text-secondary leading-relaxed">
                  {paragraph}
                </p>
              )
            })}
          </div>

          {/* Author Bio Card */}
          <div className="p-8 rounded-3xl bg-bg-card/80 border border-border flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-lg mt-14">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-white text-2xl shadow-xl flex-shrink-0">
              {post.author.charAt(0)}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <h4 className="font-bold text-base text-text-primary">{post.author}</h4>
                <Badge variant="outline" className="w-fit mx-auto sm:mx-0 text-[10px] text-text-muted border-border">
                  {post.authorRole || "Contributor"}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Writing on distributed architecture, autonomous sales intelligence, and high-ticket agency operations. Published by {post.agencyName}.
              </p>
            </div>
          </div>

          {/* High-Converting CTA Box */}
          <section className="relative rounded-3xl overflow-hidden border border-primary/40 bg-gradient-to-tr from-primary/20 via-blue-600/15 to-purple-600/10 p-8 sm:p-12 text-center space-y-5 shadow-2xl">
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
              Run your entire agency on one intelligent OS.
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
              Replace 14 disjointed subscriptions. Experience sub-300ms voice AI, wholesale telephony with 0% markup, and interactive CPQ proposals with Nexlin.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 font-bold shadow-xl shadow-primary/30 text-sm">
                  Start 14-Day Free Trial <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="outline" size="lg" className="h-12 px-6 text-xs sm:text-sm border-border bg-bg-card/50">
                  Browse More Dispatches
                </Button>
              </Link>
            </div>
          </section>

          {/* Related Articles Section */}
          {relatedPosts && relatedPosts.length > 0 && (
            <div className="pt-12 border-t border-border/80 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span>Related Dispatches</span>
                </h3>
                <Link href="/blog" className="text-xs font-semibold text-primary hover:underline">
                  View all &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedPosts.map((rel) => (
                  <article
                    key={rel.slug}
                    className="group rounded-2xl border border-border/80 bg-bg-card/60 p-6 flex flex-col justify-between hover:bg-bg-card hover:border-primary/50 transition-all shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-text-muted">
                        <span className="font-semibold text-primary uppercase">{rel.blogCategory}</span>
                        <span>{rel.readTime}</span>
                      </div>
                      <Link href={`/blog/${rel.slug}`}>
                        <h4 className="font-bold text-base text-text-primary group-hover:text-primary transition-colors line-clamp-2">
                          {rel.title}
                        </h4>
                      </Link>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {rel.summary}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-text-muted">{rel.author}</span>
                      <Link
                        href={`/blog/${rel.slug}`}
                        className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        Read <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-bg-secondary/40 text-center text-xs text-text-secondary">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">N</div>
            <span className="font-bold text-text-primary text-sm">NEXLIN JOURNAL</span>
          </div>
          <div>&copy; {new Date().getFullYear()} NEXLIN Inc. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/blog" className="text-primary font-semibold">Blog</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
