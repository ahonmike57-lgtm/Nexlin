"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Search,
  Sparkles,
  User,
  ArrowUpRight,
  Share2,
  Mail,
  CheckCircle2,
  Filter
} from "lucide-react"
import type { PublicBlogPost } from "@/app/actions/blogs"
import { toast } from "sonner"

const CATEGORIES = [
  "All",
  "Agency Growth",
  "Voice AI",
  "Sales CRM",
  "AI Automation",
  "Telephony",
  "Engineering"
]

export default function BlogIndexClient({ initialPosts }: { initialPosts: PublicBlogPost[] }) {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  // Filter posts based on category and search
  const filteredPosts = useMemo(() => {
    return initialPosts.filter(post => {
      const matchesCat =
        selectedCategory === "All" ||
        post.blogCategory.toLowerCase() === selectedCategory.toLowerCase()

      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q) ||
        post.blogCategory.toLowerCase().includes(q)

      return matchesCat && matchesSearch
    })
  }, [initialPosts, selectedCategory, searchQuery])

  // Featured post is either explicitly marked or the first post
  const featuredPost = useMemo(() => {
    return initialPosts.find(p => p.featured) || initialPosts[0]
  }, [initialPosts])

  // Remaining posts for the grid
  const gridPosts = useMemo(() => {
    if (searchQuery || selectedCategory !== "All") {
      return filteredPosts
    }
    return filteredPosts.filter(p => p.slug !== featuredPost?.slug)
  }, [filteredPosts, featuredPost, searchQuery, selectedCategory])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast.error("Please enter a valid work email address.")
      return
    }
    setSubscribed(true)
    toast.success("Welcome aboard! You're subscribed to The Nexlin Dispatch.")
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-primary/15 via-blue-500/10 to-purple-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] -right-40 w-[600px] h-[600px] bg-emerald-500/5 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full bg-bg-primary/85 backdrop-blur-xl border-b border-border/70 transition-all duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg tracking-wider">N</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-primary to-blue-600">
                NEXLIN
              </span>
            </Link>
            <span className="text-border">/</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-primary border-primary/30 uppercase tracking-widest px-2.5 py-0.5">
              Journal
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-text-secondary hover:text-text-primary hidden sm:inline-block transition-colors"
            >
              Platform Overview
            </Link>
            <Link href="/login" className="text-xs font-semibold hover:text-primary px-3 py-1.5 transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-lg shadow-primary/25 font-semibold text-xs px-3.5 h-8">
                Start Free Trial <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-8 max-w-7xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur-md">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span>The Official Nexlin Engineering & Strategy Journal</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.12]">
          Architecting the modern <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-indigo-500">
            agency operating system.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-text-secondary leading-relaxed">
          Deep technical breakdowns, voice AI latency benchmarks, CPQ conversion engineering, and scale playbooks for modern digital agencies.
        </p>

        {/* Search & Category Filter Bar */}
        <div className="pt-6 max-w-3xl mx-auto space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              type="text"
              placeholder="Search by topic, keyword, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 pr-4 bg-bg-card/70 border-border/80 rounded-2xl text-sm focus:border-primary transition shadow-inner backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-primary px-1.5 py-0.5 rounded bg-bg-secondary"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.toLowerCase()
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/25 font-semibold"
                      : "bg-bg-card/60 hover:bg-bg-card text-text-secondary hover:text-text-primary border border-border/60"
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-24 space-y-16">
        {/* Featured Story Hero (Shown when no search/category filter is active) */}
        {!searchQuery && selectedCategory === "All" && featuredPost && (
          <div className="group relative rounded-3xl overflow-hidden border border-border/80 bg-gradient-to-b from-bg-card/90 to-bg-card/50 shadow-2xl hover:border-primary/40 transition-all duration-300">
            <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-between gap-8">
              <div className="space-y-4 max-w-4xl">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-primary/15 text-primary border-primary/30 text-xs px-2.5 py-1">
                    Featured Story
                  </Badge>
                  <span className="text-xs font-medium text-text-muted">•</span>
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {featuredPost.blogCategory}
                  </span>
                  <span className="text-xs font-medium text-text-muted">•</span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {featuredPost.readTime}
                  </span>
                </div>

                <Link href={`/blog/${featuredPost.slug}`}>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-text-primary group-hover:text-primary transition-colors leading-[1.18]">
                    {featuredPost.title}
                  </h2>
                </Link>

                <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-3xl font-normal">
                  {featuredPost.summary}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                    {featuredPost.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-text-primary">{featuredPost.author}</h4>
                    <p className="text-[11px] text-text-muted">{featuredPost.authorRole || featuredPost.agencyName}</p>
                  </div>
                </div>

                <Link href={`/blog/${featuredPost.slug}`}>
                  <Button className="font-semibold text-xs px-5 h-10 shadow-lg shadow-primary/20 group/btn">
                    Read Article <ArrowUpRight className="w-4 h-4 ml-1.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <h3 className="text-lg font-bold tracking-tight text-text-primary flex items-center gap-2">
              <span>Latest Dispatches</span>
              <span className="text-xs font-normal text-text-muted">({filteredPosts.length} articles)</span>
            </h3>

            {(searchQuery || selectedCategory !== "All") && (
              <button
                onClick={() => {
                  setSelectedCategory("All")
                  setSearchQuery("")
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          {gridPosts.length === 0 ? (
            <div className="p-16 rounded-3xl border border-dashed border-border text-center space-y-3 bg-bg-card/40">
              <BookOpen className="w-8 h-8 text-text-muted mx-auto" />
              <h4 className="font-bold text-base text-text-primary">No articles found</h4>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                No articles matched &quot;{searchQuery || selectedCategory}&quot;. Try adjusting your keywords or category filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory("All")
                  setSearchQuery("")
                }}
                className="mt-2 text-xs"
              >
                View all articles
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => {
                const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })

                return (
                  <article
                    key={post.id || post.slug}
                    className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-bg-card/70 hover:bg-bg-card hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden"
                  >
                    {/* Top Aesthetic Ribbon */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        {/* Meta pill row */}
                        <div className="flex items-center justify-between text-[11px] text-text-muted">
                          <span className="font-semibold text-primary uppercase tracking-wider">
                            {post.blogCategory}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" /> {post.readTime}
                          </span>
                        </div>

                        {/* Title */}
                        <Link href={`/blog/${post.slug}`}>
                          <h4 className="font-bold text-base sm:text-lg text-text-primary group-hover:text-primary transition-colors leading-snug line-clamp-2">
                            {post.title}
                          </h4>
                        </Link>

                        {/* Summary */}
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                          {post.summary}
                        </p>
                      </div>

                      {/* Footer Row */}
                      <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                            {post.author.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-text-primary text-[11px] block leading-none">
                              {post.author}
                            </span>
                            <span className="text-[10px] text-text-muted leading-none">
                              {formattedDate}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-primary font-semibold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                        >
                          Read <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {/* Newsletter Subscription Card */}
        <section className="relative rounded-3xl overflow-hidden border border-primary/30 bg-gradient-to-tr from-primary/15 via-blue-500/10 to-indigo-500/10 p-8 sm:p-14 text-center space-y-6 shadow-2xl">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto shadow-inner">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Stay Ahead of Agency Architecture
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Join 12,500+ digital agency founders receiving our bi-weekly teardowns on autonomous voice infrastructure, wholesale telephony, and AI CRM workflows.
            </p>
          </div>

          {subscribed ? (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>You&apos;re subscribed to The Nexlin Dispatch! Check your inbox.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="founder@youragency.com"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="h-12 bg-bg-card/90 border-border text-sm rounded-xl focus:border-primary shadow-inner"
              />
              <Button type="submit" className="h-12 px-6 font-bold shadow-lg shadow-primary/30 rounded-xl text-xs sm:text-sm whitespace-nowrap">
                Subscribe Free
              </Button>
            </form>
          )}

          <p className="text-[11px] text-text-muted">Zero spam. Actionable operator playbooks only. Unsubscribe with 1 click anytime.</p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-bg-secondary/40 text-center text-xs text-text-secondary">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">N</div>
            <span className="font-bold text-text-primary text-sm">NEXLIN JOURNAL</span>
          </div>
          <div>&copy; {new Date().getFullYear()} NEXLIN Inc. The OS for High-Performance Digital Agencies.</div>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/blog" className="text-primary font-semibold">Blog</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
            <Link href="/register" className="hover:text-primary transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
