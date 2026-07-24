"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface RevenueData {
  name: string
  revenue: number
}

export default function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          dy={10}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--background))", 
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px"
          }} 
          itemStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stroke="hsl(var(--primary))" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorRevenue)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
