"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldAlert, KeyRound, Smartphone } from "lucide-react"

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Security</h2>
        <p className="text-text-secondary">Manage your password and secure your account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> Password</CardTitle>
          <CardDescription>Update your password associated with your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5 text-primary" /> Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button>Enable 2FA</Button>
        </CardContent>
      </Card>

      <Card className="border-error/20 bg-error/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-error"><ShieldAlert className="w-5 h-5" /> Danger Zone</CardTitle>
          <CardDescription>Permanently delete your agency and all associated data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="danger">Delete Agency Workspace</Button>
        </CardContent>
      </Card>
    </div>
  )
}
