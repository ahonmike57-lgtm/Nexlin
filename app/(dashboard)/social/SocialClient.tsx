"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, Share2, Sparkles, ChevronLeft, ChevronRight, Link as LinkIcon, Trash2, Globe, AtSign, BookOpen, Briefcase } from "lucide-react"
import { createSocialPost, connectSocialAccount, disconnectSocialAccount } from "@/app/actions/social"
import { generateAiReply } from "@/app/actions/ai"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"

export default function SocialClient({ initialAccounts, initialPosts, agencyId }: { initialAccounts: any[], initialPosts: any[], agencyId: string }) {
  const [activeTab, setActiveTab] = useState("calendar")
  const [accounts, setAccounts] = useState(initialAccounts)
  const [posts, setPosts] = useState(initialPosts)
  
  // Dialog States
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  
  // Post Composer State
  const [newPost, setNewPost] = useState({ content: "", accountId: "", scheduledFor: "" })
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date())

  // --- ACTIONS ---

  const handleCreatePost = async () => {
    if (!newPost.content || !newPost.accountId || !newPost.scheduledFor) {
      toast.error("Please fill in all fields.")
      return
    }

    try {
      const res = await createSocialPost(agencyId, newPost.accountId, newPost.content, new Date(newPost.scheduledFor))

      if (res.success) {
        toast.success("Post scheduled successfully!")
        setPosts([...posts, { ...res.post, account: accounts.find(a => a.id === newPost.accountId) }])
        setIsPostDialogOpen(false)
        setNewPost({ content: "", accountId: "", scheduledFor: "" })
      } else {
        toast.error(res.error || "Failed to schedule post.")
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleGenerateAI = async () => {
    if (!aiPrompt) return toast.error("Please enter a topic to generate.")
    setIsGenerating(true)
    const prompt = `Write an engaging social media post about: ${aiPrompt}. Keep it professional, use emojis, and include relevant hashtags. Do not include quotes around the post.`
    const res = await generateAiReply(agencyId, prompt)
    if (res.success) {
      setNewPost(prev => ({ ...prev, content: res.reply }))
      setAiPrompt("")
    } else {
      toast.error("AI Generation failed")
    }
    setIsGenerating(false)
  }

  const handleConnectAccount = async (platform: string, handle: string) => {
    const res = await connectSocialAccount(agencyId, platform, handle)
    if (res.success) {
      toast.success(`${platform} connected successfully!`)
      setAccounts([...accounts, res.account])
      setIsAccountDialogOpen(false)
    } else {
      toast.error("Failed to connect account")
    }
  }

  const handleDisconnect = async (id: string) => {
    const res = await disconnectSocialAccount(id)
    if (res.success) {
      toast.success("Account disconnected")
      setAccounts(accounts.filter(a => a.id !== id))
    }
  }

  // --- HELPERS ---

  const getPlatformIcon = (platform: string, className = "h-4 w-4") => {
    switch (platform?.toLowerCase()) {
      case "facebook":  return <div className={`${className} rounded-sm bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>f</div>
      case "twitter":   return <div className={`${className} rounded-sm bg-[#000000] text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>𝕏</div>
      case "instagram": return <div className={`${className} rounded-sm bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>ig</div>
      case "linkedin":  return <div className={`${className} rounded-sm bg-[#0A66C2] text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>in</div>
      default:          return <Share2 className={`${className} text-text-secondary`} />
    }
  }

  // Calendar Logic
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const dateFormat = "d"
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Planner</h1>
          <p className="text-text-secondary mt-1">Schedule and manage your cross-platform content.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><LinkIcon className="mr-2 h-4 w-4" /> Connect Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Connect Social Account</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].map(plat => (
                  <Button 
                    key={plat} 
                    variant="outline" 
                    className="h-20 flex flex-col justify-center items-center gap-2"
                    onClick={() => handleConnectAccount(plat, `@agency_${plat.toLowerCase()}`)}
                  >
                    {getPlatformIcon(plat, "h-6 w-6")}
                    <span>{plat}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Compose Post</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                
                {/* AI Composer */}
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <Sparkles className="h-4 w-4" /> AI Post Generator
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. 5 tips for summer marketing..."
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                    />
                    <Button size="sm" onClick={handleGenerateAI} disabled={isGenerating}>
                      {isGenerating ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Account</label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newPost.accountId}
                    onChange={(e) => setNewPost({ ...newPost, accountId: e.target.value })}
                  >
                    <option value="">Select an account...</option>
                    {accounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>{acc.platform} - {acc.handle}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Post Content</label>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="What do you want to share?"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Schedule For</label>
                  <input
                    type="datetime-local"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={newPost.scheduledFor}
                    onChange={(e) => setNewPost({ ...newPost, scheduledFor: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreatePost} className="w-full">Schedule Post</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CONNECTED ACCOUNTS TRAY */}
      {accounts.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center gap-3 bg-bg-secondary border border-border rounded-full pl-2 pr-4 py-1.5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-bg-primary flex items-center justify-center border border-border shadow-sm">
                {getPlatformIcon(acc.platform)}
              </div>
              <span className="text-sm font-medium">{acc.handle}</span>
              <button onClick={() => handleDisconnect(acc.id)} className="text-text-secondary hover:text-destructive ml-2">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-border">
        <button 
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'calendar' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar View
        </button>
        <button 
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          onClick={() => setActiveTab('list')}
        >
          List View
        </button>
      </div>

      {/* VIEWS */}
      {activeTab === 'calendar' ? (
        <div className="bg-bg-primary border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-bg-secondary/50">
            <h2 className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-border bg-bg-secondary/20">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-medium text-text-secondary uppercase tracking-wider border-r border-border last:border-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[120px]">
            {calendarDays.map((day, i) => {
              const dayPosts = posts.filter(p => isSameDay(new Date(p.scheduledFor), day))
              
              return (
                <div 
                  key={i} 
                  className={`border-b border-r border-border p-2 ${!isSameMonth(day, monthStart) ? 'bg-bg-secondary/30 text-text-secondary' : ''} hover:bg-bg-secondary/10 transition-colors`}
                  onClick={() => {
                    setNewPost(prev => ({ ...prev, scheduledFor: format(day, "yyyy-MM-dd'T'12:00") }))
                    setIsPostDialogOpen(true)
                  }}
                >
                  <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                    {format(day, dateFormat)}
                  </span>
                  <div className="mt-2 space-y-1 overflow-y-auto max-h-[70px] no-scrollbar">
                    {dayPosts.map(p => (
                      <div key={p.id} className="text-[10px] flex items-center gap-1.5 p-1 rounded bg-bg-secondary border border-border truncate" title={p.content}>
                        {getPlatformIcon(p.account?.platform, "h-3 w-3 shrink-0")}
                        <span className="truncate font-medium">{format(new Date(p.scheduledFor), "h:mm a")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-bg-primary border border-border rounded-xl overflow-hidden shadow-sm">
          {posts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <CalendarIcon className="h-12 w-12 text-border mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No Posts Scheduled</h3>
              <p className="text-text-secondary mb-4">Start planning your content by scheduling your first post.</p>
              <Button onClick={() => setIsPostDialogOpen(true)}>Create Post</Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {posts.map((post: any) => (
                <div key={post.id} className="p-6 flex items-start gap-4 hover:bg-bg-secondary/30 transition-colors">
                  <div className="mt-1 shrink-0">
                    {getPlatformIcon(post.account?.platform, "h-8 w-8")}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{post.account?.handle || "Unknown Account"}</p>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{post.status}</Badge>
                    </div>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{post.content}</p>
                    <p className="text-xs text-text-secondary pt-2 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      Scheduled for {new Date(post.scheduledFor).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
