"use client"

import { useState } from "react"
import { generateProspectingAudit } from "@/app/actions/prospecting"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Building, CheckCircle2, AlertTriangle, Download, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

export default function ProspectingPage() {
  const [businessName, setBusinessName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName || !websiteUrl) return

    setLoading(true)
    const res = await generateProspectingAudit(businessName, websiteUrl, city)
    if (res.success && res.report) {
      setReport(res.report)
      toast.success("Prospecting audit report generated!")
    } else {
      toast.error(res.error || "Failed to generate report")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Prospecting Audit Engine</h1>
        <p className="text-text-secondary mt-1">Scan local businesses to generate white-labeled SEO & online presence report cards for client acquisition.</p>
      </div>

      <Card className="bg-bg-primary border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" /> Target Business Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRunAudit} className="grid sm:grid-cols-3 gap-3">
            <Input
              placeholder="Business Name (e.g. Acme Dental)"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
            <Input
              placeholder="Website URL (e.g. acmedental.com)"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              required
            />
            <Input
              placeholder="City, State (e.g. Austin, TX)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <div className="sm:col-span-3 flex justify-end">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Run Audit Scan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center bg-bg-primary border border-border p-6 rounded-2xl">
            <div>
              <span className="text-xs uppercase font-semibold text-text-secondary tracking-wider">Overall Presence Score</span>
              <h2 className="text-4xl font-extrabold text-primary mt-1">{report.overallScore} / 100</h2>
            </div>
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" /> Export Audit PDF
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(report.scores || {}).map(([key, score]: any) => (
              <Card key={key} className="bg-bg-primary border-border">
                <CardContent className="p-4">
                  <div className="text-xs text-text-secondary capitalize">{key.replace(/([A-Z])/g, " $1")}</div>
                  <div className="text-2xl font-bold text-text-primary mt-1">{score} / 100</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-bg-primary border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-error">
                  <AlertTriangle className="w-4 h-4" /> Detected Visibility Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(report.keyIssues || []).map((issue: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-text-secondary p-2 rounded bg-error/5 border border-error/10">
                    <span className="text-error font-bold">•</span>
                    <span>{issue}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-bg-primary border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-success">
                  <Sparkles className="w-4 h-4" /> Recommended Revenue Solutions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(report.opportunities || []).map((opp: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-text-secondary p-2 rounded bg-success/5 border border-success/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                    <span>{opp}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
