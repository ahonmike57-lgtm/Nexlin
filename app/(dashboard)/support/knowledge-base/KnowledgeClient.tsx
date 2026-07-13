"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen, Search, ArrowRight } from "lucide-react"
import { createKnowledgeArticle } from "@/app/actions/knowledge"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function KnowledgeClient({ initialArticles, agencyId }: { initialArticles: any[], agencyId: string }) {
  const [articles, setArticles] = useState(initialArticles)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newArticle, setNewArticle] = useState({ title: "", content: "", category: "" })
  const [search, setSearch] = useState("")

  const handleCreateArticle = async () => {
    if (!newArticle.title || !newArticle.content || !newArticle.category) {
      toast.error("Please fill in all fields.")
      return
    }

    try {
      const res = await createKnowledgeArticle(agencyId, {
        title: newArticle.title,
        content: newArticle.content,
        category: newArticle.category,
        authorId: "user-1", // mock author
      })

      if (res.success) {
        toast.success("Article created successfully!")
        setArticles([res.article, ...articles])
        setIsDialogOpen(false)
        setNewArticle({ title: "", content: "", category: "" })
      } else {
        toast.error(res.error || "Failed to create article.")
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-1">Manage help articles to support your customers.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Knowledge Article</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Article Title</label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g. How to set up your inbox"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g. Getting Started"
                  value={newArticle.category}
                  onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <textarea
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                  placeholder="Write your article content here... (Markdown supported)"
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateArticle} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Publish Article
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search articles by title or category..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
            No articles found. Try a different search or create a new one!
          </div>
        ) : (
          filteredArticles.map((article: any) => (
            <div key={article.id} className="bg-white dark:bg-slate-900 border rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-full">
                  {article.category}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white line-clamp-2">
                {article.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-4 flex-1">
                {article.content}
              </p>
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10">
                  Read <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
