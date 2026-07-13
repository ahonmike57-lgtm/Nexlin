"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, Share2, Globe } from "lucide-react"
import { createSocialPost } from "@/app/actions/social"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function SocialClient({ initialAccounts, initialPosts, agencyId }: { initialAccounts: any[], initialPosts: any[], agencyId: string }) {
  const [posts, setPosts] = useState(initialPosts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({ content: "", accountId: "", scheduledFor: "" })

  const handleCreatePost = async () => {
    if (!newPost.content || !newPost.accountId || !newPost.scheduledFor) {
      toast.error("Please fill in all fields.")
      return
    }

    try {
      const res = await createSocialPost(agencyId, {
        content: newPost.content,
        accountId: newPost.accountId,
        scheduledFor: new Date(newPost.scheduledFor).toISOString(),
        status: "scheduled"
      })

      if (res.success) {
        toast.success("Post scheduled successfully!")
        setPosts([...posts, res.post])
        setIsDialogOpen(false)
        setNewPost({ content: "", accountId: "", scheduledFor: "" })
      } else {
        toast.error(res.error || "Failed to schedule post.")
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const getPlatformIcon = (platform: string) => {
    return <Share2 className="h-4 w-4" />
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Social Planner</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage your social media content.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Account</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newPost.accountId}
                  onChange={(e) => setNewPost({ ...newPost, accountId: e.target.value })}
                >
                  <option value="">Select an account...</option>
                  {initialAccounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>{acc.platform} - {acc.handle}</option>
                  ))}
                  {/* Mock account if empty */}
                  {initialAccounts.length === 0 && (
                    <option value="mock-acc-1">Mock Facebook Account</option>
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Post Content</label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="What do you want to share?"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Schedule For</label>
                <input
                  type="datetime-local"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newPost.scheduledFor}
                  onChange={(e) => setNewPost({ ...newPost, scheduledFor: e.target.value })}
                />
              </div>
              <Button onClick={handleCreatePost} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Schedule Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CalendarIcon className="mx-auto h-12 w-12 opacity-20 mb-3" />
            <p>No posts scheduled yet.</p>
            <Button variant="link" onClick={() => setIsDialogOpen(true)}>Create your first post</Button>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post: any) => (
              <div key={post.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="mt-1">
                  {getPlatformIcon(post.account?.platform || "facebook")}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-slate-900 dark:text-white">
                      {post.account?.handle || "Unknown Account"}
                    </p>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {post.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{post.content}</p>
                  <p className="text-xs text-muted-foreground pt-2 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Scheduled for {new Date(post.scheduledFor).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
