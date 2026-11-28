"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Star, MessageSquare, Send, Mail, Smartphone, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sendReviewRequest } from "@/app/actions/reputation"
import { toast } from "sonner"

export default function ReputationClient({ initialData, contacts, agencyId }: { initialData: any, contacts: any[], agencyId: string }) {
  const { stats, reviews = [] } = initialData
  const [selectedContact, setSelectedContact] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("email")
  const [sending, setSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const totalReviews = Number(stats?.totalReviews ?? reviews.length ?? 0)
  const averageRating = totalReviews > 0 && stats?.averageRating ? String(stats.averageRating) : "0.0"
  const requestsSent = Number(stats?.requestsSent ?? 0)

  const handleCopyReviewLink = async () => {
    const url = `${window.location.origin}/review/${agencyId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      toast.success("Public review link copied to clipboard")
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      toast.error(`Review link: ${url}`)
    }
  }

  const handleSendRequest = async () => {
    if (!selectedContact) {
      toast.error("Please select a contact")
      return
    }

    setSending(true)
    const res = await sendReviewRequest(selectedContact, selectedChannel)
    setSending(false)

    if (res.success) {
      toast.success(`Review request sent via ${selectedChannel}`)
      setIsOpen(false)
    } else {
      toast.error("error" in res ? res.error : "Failed to send request")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reputation Management</h1>
          <p className="text-text-secondary text-sm">Monitor and grow your online reviews.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCopyReviewLink} className="gap-2">
            {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            Copy Review Link
          </Button>

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
                      className={`flex-1 p-3 border rounded-lg cursor-pointer flex flex-col items-center gap-2 transition-colors ${selectedChannel === "email" ? "border-primary bg-primary/5 text-primary" : "border-border text-text-secondary hover:border-primary/50"}`}
                      onClick={() => setSelectedChannel("email")}
                    >
                      <Mail className="w-5 h-5" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <div
                      className={`flex-1 p-3 border rounded-lg cursor-pointer flex flex-col items-center gap-2 transition-colors ${selectedChannel === "sms" ? "border-primary bg-primary/5 text-primary" : "border-border text-text-secondary hover:border-primary/50"}`}
                      onClick={() => setSelectedChannel("sms")}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating}</div>
            <p className="text-xs text-text-secondary mt-1">
              {totalReviews > 0 ? "Across all platforms" : "No ratings recorded yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
            <p className="text-xs text-text-secondary mt-1">Verified customer feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Invites Sent</CardTitle>
            <Send className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestsSent}</div>
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
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border rounded-lg bg-bg-secondary/30">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-base font-medium mb-1">No customer reviews yet</h3>
              <p className="text-sm text-text-secondary max-w-md mb-4">
                Share your public review link or send a review request to start collecting real ratings.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyReviewLink} className="gap-1.5">
                  <Copy className="w-3.5 h-3.5" />
                  Copy Public Review Link
                </Button>
                <Button size="sm" onClick={() => setIsOpen(true)} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Send Review Request
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any) => (
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
                  <p className="text-sm text-text-secondary mb-3">&ldquo;{review.content}&rdquo;</p>
                  <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
