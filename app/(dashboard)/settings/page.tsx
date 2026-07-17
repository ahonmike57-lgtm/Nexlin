"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold mb-1">General Settings</h2>
        <p className="text-text-secondary">Manage your core agency preferences and features.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Missed Call Text Back</CardTitle>
          <CardDescription>Automatically send a text message when you miss a call.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">Enable Missed Call Text Back</h4>
              <p className="text-xs text-text-secondary">Sends a custom message to the caller automatically.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">Custom Message</label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              defaultValue="Hi, this is [Agency Name]. We missed your call, how can we help?"
            ></textarea>
            <p className="text-xs text-text-secondary">Use tags like [Agency Name], [Contact Name] to personalize.</p>
          </div>
          
          <Button className="mt-2">Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  )
}
