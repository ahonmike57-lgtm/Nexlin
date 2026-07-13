"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, TrendingUp, Activity, ArrowUpRight } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-text-secondary">Welcome back, John. Here&apos;s what&apos;s happening today.</p>
        </div>
        <Badge variant="success" className="px-3 py-1 text-sm">
          <Activity className="w-4 h-4 mr-1 inline" /> AI Business Coach Active
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">Total Revenue</h3>
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">$24,500</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary">Active Contacts</h3>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">1,248</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +48 this week
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
            <div className="text-3xl font-bold">68%</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary text-white border-none">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-primary-100 mb-2">AI Business Coach</h3>
            <p className="text-sm mb-4">Your sales follow-up rate dropped by 15% yesterday. Want me to draft a reminder email for the team?</p>
            <button className="bg-white text-primary text-xs font-semibold px-4 py-2 rounded-lg w-full">
              Generate Email
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly recurring revenue via Stripe & Paystack</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end gap-2 pt-8">
              {[40, 60, 45, 80, 65, 90, 75, 100, 85, 110, 95, 120].map((val, i) => (
                <div key={i} className="w-full bg-primary/20 rounded-t-md relative group">
                  <div 
                    className="absolute bottom-0 w-full bg-primary rounded-t-md transition-all duration-500 group-hover:bg-primary-hover"
                    style={{ height: `${val}%` }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-text-secondary">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
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
