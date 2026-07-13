"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Star, MessageSquare, Send, Mail, Smartphone, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sendReviewRequest } from "@/app/actions/reputation"
import { toast } from "sonner"

export default function ReputationClient({ initialData, contacts, agencyId }: { initialData: any, contacts: any[], agencyId: string }) {
  const { stats, reviews, requests } = initialData
  const [selectedContact, setSelectedContact] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("email")
  const [sending, setSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Mock initial reviews if empty for demonstration
  const displayReviews = reviews?.length > 0 ? reviews : [
    { id: 1, authorName: "Sarah Johnson", rating: 5, content: "Amazing service! The team was super helpful.", platform: "google", createdAt: new Date(Date.now() - 86400000 * 2) },
    { id: 2, authorName: "Michael Chen", rating: 4, content: "Great experience overall, just a slight delay in response.", platform: "facebook", createdAt: new Date(Date.now() - 86400000 * 5) },
  ]

  const displayStats = {
    totalReviews: stats?.totalReviews || 2,
    averageRating: stats?.averageRating !== "0" ? stats?.averageRating : "4.5",
    requestsSent: stats?.requestsSent || 0
  }

  const handleSendRequest = async () => {
    if (!selectedContact) {
      toast.error("Please select a contact")
      return
    }
    
    setSending(true)
    const res = await sendReviewRequest(agencyId, selectedContact, selectedChannel)
    setSending(false)
    
    if (res.success) {
      toast.success(`Review request sent via ${selectedChannel}`)
      setIsOpen(false)
    } else {
      toast.error(res.error || "Failed to send request")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reputation Management</h1>
          <p className="text-text-secondary text-sm">Monitor and grow your online reviews.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Send className="w-4 h-4" />
              Send Review Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Review Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Contact</label>
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search contacts..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.email})
                      </SelectItem>
                    ))}
                    {contacts.length === 0 && (
                      <SelectItem value="none" disabled>No contacts found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Channel</label>
                <div className="flex gap-4">
                  <div 
                    className={`flex-1 p-3 border rounded-lg cursor-pointer flex flex-col items-center gap-2 transition-colors ${selectedChannel === 'email' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-primary/50'}`}
                    onClick={() => setSelectedChannel('email')}
                  >
                    <Mail className="w-5 h-5" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <div 
                    className={`flex-1 p-3 border rounded-lg cursor-pointer flex flex-col items-center gap-2 transition-colors ${selectedChannel === 'sms' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-primary/50'}`}
                    onClick={() => setSelectedChannel('sms')}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-sm font-medium">SMS</span>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSendRequest} disabled={sending} className="w-full">
                {sending ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.averageRating}</div>
            <p className="text-xs text-text-secondary mt-1">Across all platforms</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.totalReviews}</div>
            <p className="text-xs text-text-secondary mt-1">+2 this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Invites Sent</CardTitle>
            <Send className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.requestsSent}</div>
            <p className="text-xs text-text-secondary mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
          <CardDescription>The latest feedback from your customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayReviews.map((review: any) => (
              <div key={review.id} className="p-4 border border-border rounded-lg bg-bg-secondary/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{review.authorName}</div>
                    <div className="text-xs text-text-secondary capitalize px-2 py-0.5 bg-bg-primary rounded-full border border-border">
                      {review.platform}
                    </div>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-current" : "text-border"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-3">"{review.content}"</p>
                <div className="flex justify-between items-center text-xs text-text-secondary">
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    View <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
