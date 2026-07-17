export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, TrendingUp, Activity, ArrowUpRight } from "lucide-react"
import { db } from "@/lib/db"
import { getOrCreateAgency } from "@/app/actions/agency"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import RevenueChart from "./revenue-chart"
import DashboardAICoach from "./DashboardAICoach"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()

  // Fetch real data scoped to this agency
  const totalContacts = await db.contact.count({ where: { agencyId } })

  const deals = await db.deal.findMany({ where: { agencyId } })
  const totalRevenue = deals.reduce((acc, deal) => acc + deal.value, 0)

  const wonDeals = deals.filter(d => d.stage.toLowerCase() === "won" || d.stage.toLowerCase() === "closed won")
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-text-secondary">Welcome back. Here&apos;s what&apos;s happening today.</p>
        </div>
        <Badge variant="success" className="px-3 py-1 text-sm bg-green-500/15 text-green-500 hover:bg-green-500/25 border-none">
          <Activity className="w-4 h-4 mr-1 inline" /> AI Coach Active
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">Pipeline Value</h3>
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Real-time metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">Total Contacts</h3>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">{totalContacts.toLocaleString()}</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Real-time metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">Win Rate</h3>
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">{winRate}%</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Based on won deals
            </p>
          </CardContent>
        </Card>

        <Card className="border-none p-0 overflow-hidden">
          <CardContent className="p-0">
            <DashboardAICoach agencyId={agencyId} />
          </CardContent>
        </Card>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly recurring revenue via Stripe &amp; Paystack</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
               <RevenueChart />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>What&apos;s happening right now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { text: "Sarah won the 'Enterprise Plan' deal", time: "2m ago", color: "bg-success" },
              { text: "New ticket from Acme Corp", time: "15m ago", color: "bg-warning" },
              { text: "Stripe payout processed", time: "1h ago", color: "bg-primary" },
              { text: "New lead from website chat", time: "3h ago", color: "bg-secondary" },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1 relative flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${activity.color}`}></div>
                  {i !== 3 && <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-border"></div>}
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.text}</p>
                  <p className="text-xs text-text-secondary">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
