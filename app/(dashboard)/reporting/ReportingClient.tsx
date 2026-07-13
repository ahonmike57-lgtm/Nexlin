"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, Activity, Target } from "lucide-react"

export default function ReportingClient({ initialMetrics }: { initialMetrics: any }) {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Reporting</h1>
          <p className="text-text-secondary mt-1">Key metrics and analytics across your entire agency.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialMetrics.totalContacts}</div>
            <p className="text-xs text-text-secondary">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Target className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialMetrics.totalDeals}</div>
            <p className="text-xs text-text-secondary">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${initialMetrics.pipelineValue.toLocaleString()}</div>
            <p className="text-xs text-text-secondary">+10% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialMetrics.totalCampaigns}</div>
            <p className="text-xs text-text-secondary">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="min-h-[300px] flex items-center justify-center border-dashed">
          <p className="text-text-secondary">Revenue Chart (Coming Soon)</p>
        </Card>
        <Card className="min-h-[300px] flex items-center justify-center border-dashed">
          <p className="text-text-secondary">Lead Conversion Chart (Coming Soon)</p>
        </Card>
      </div>
    </div>
  )
}
