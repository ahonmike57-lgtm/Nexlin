"use client"

import { useState, useEffect } from "react"
import { getBlogPosts, createBlogPost, deleteBlogPost } from "@/app/actions/blogs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Trash2, Globe, FileText, Loader2, Sparkles } from "lucide-react"
import { generateAiReply } from "@/app/actions/ai"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function BlogsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    author: "Agency Editor",
    category: "Marketing",
    status: "published" as "draft" | "published"
  })

  const loadPosts = async () => {
    setLoading(true)
    const res = await getBlogPosts()
    if (res.success && res.posts) {
      setPosts(res.posts)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handleAiGenerate = async () => {
    if (!form.title) {
      toast.error("Please enter a blog title first")
      return
    }
    setGenerating(true)
    const prompt = `Write a comprehensive blog post body and a 2-sentence summary for the article title: "${form.title}". Return JSON format with keys "summary" and "content".`
    const res = await generateAiReply("", prompt)
    if (res.success && res.data) {
      try {
        const parsed = JSON.parse(res.data.replace(/```json|```/g, "").trim())
        setForm(prev => ({ ...prev, summary: parsed.summary || prev.summary, content: parsed.content || res.data }))
        toast.success("AI draft generated!")
      } catch {
        setForm(prev => ({ ...prev, content: res.data || "" }))
      }
    } else {
      toast.error("Failed to generate AI article")
    }
    setGenerating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) return

    setSaving(true)
    const res = await createBlogPost(form)
    if (res.success) {
      toast.success("Blog post published!")
      setIsOpen(false)
      setForm({ title: "", slug: "", summary: "", content: "", author: "Agency Editor", category: "Marketing", status: "published" })
      loadPosts()
    } else {
      toast.error(res.error || "Failed to publish article")
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const res = await deleteBlogPost(id)
    if (res.success) {
      toast.success("Post deleted")
      setPosts(prev => prev.filter(p => p.id !== id))
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Native Blogging CMS</h1>
          <p className="text-text-secondary mt-1">Draft, schedule, and publish SEO-optimized articles onto your root domain.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Blog Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-bg-primary border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> New Article Draft
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Article Title</label>
                <Input
                  placeholder="e.g. 10 Strategies to Scale Your Local Business"
                  value={form.title}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-")
                    })
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">URL Slug</label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Category</label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Short Summary</label>
                <textarea
                  className="w-full h-16 p-2 text-xs bg-bg-secondary border border-border rounded-lg"
                  placeholder="Brief excerpt for search results..."
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium">Article Body (Markdown / HTML)</label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleAiGenerate} disabled={generating}>
                    <Sparkles className={`w-3.5 h-3.5 mr-1 text-primary ${generating ? 'animate-spin' : ''}`} />
                    Generate with AI
                  </Button>
                </div>
                <textarea
                  className="w-full h-48 p-3 text-xs font-mono bg-bg-secondary border border-border rounded-lg"
                  placeholder="Write full article body content..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Publish Article
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-bg-primary rounded-xl border border-border space-y-3">
          <BookOpen className="w-10 h-10 text-text-secondary mx-auto" />
          <h3 className="font-semibold text-lg">No Blog Posts Published Yet</h3>
          <p className="text-sm text-text-secondary">Click "Create Blog Post" to draft and publish your first article.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div key={post.id} className="p-5 rounded-xl border border-border bg-bg-primary flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold">{post.blogCategory || "General"}</Badge>
                  <span className="text-xs text-text-secondary">{post.status}</span>
                </div>
                <h3 className="font-semibold text-lg text-text-primary line-clamp-2">{post.name}</h3>
                <p className="text-xs text-text-secondary mt-2 line-clamp-3">{post.summary || "No summary provided."}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-text-secondary">
                <span>By {post.author || "Editor"}</span>
                <Button variant="ghost" size="sm" className="h-8 text-error hover:text-error" onClick={() => handleDelete(post.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
