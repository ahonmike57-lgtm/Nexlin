"use client"

import { BarChart3, TrendingUp, Users, DollarSign, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ForgeAnalyticsWidget() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0b101d] border-border">
          <CardContent className="p-4">
            <div className="text-xs text-text-secondary flex items-center justify-between">
              <span>Total Visitors</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-white font-mono mt-1">2,193</div>
            <div className="text-[10px] text-success mt-1">+14.2% from last week</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0b101d] border-border">
          <CardContent className="p-4">
            <div className="text-xs text-text-secondary flex items-center justify-between">
              <span>Leads Captured</span>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-white font-mono mt-1">346</div>
            <div className="text-[10px] text-success mt-1">15.7% Conversion Rate</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0b101d] border-border">
          <CardContent className="p-4">
            <div className="text-xs text-text-secondary flex items-center justify-between">
              <span>Call Porter Callbacks</span>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div className="text-2xl font-bold text-white font-mono mt-1">173</div>
            <div className="text-[10px] text-text-secondary mt-1">Avg 48s Speed to Call</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0b101d] border-border">
          <CardContent className="p-4">
            <div className="text-xs text-text-secondary flex items-center justify-between">
              <span>Pipeline Deal Value</span>
              <DollarSign className="w-4 h-4 text-[#F5A623]" />
            </div>
            <div className="text-2xl font-bold text-[#F5A623] font-mono mt-1">$412,500</div>
            <div className="text-[10px] text-text-secondary mt-1">From 48 closed sales</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
