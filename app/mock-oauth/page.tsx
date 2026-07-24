"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function MockOAuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const state = searchParams.get("state")
  
  let platform = "Unknown"
  try {
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('ascii'))
      platform = decoded.platform || "Unknown"
      // Capitalize first letter
      platform = platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase()
    }
  } catch (e) {}

  const handleAuthorize = () => {
    // Generate a mock code and redirect to callback
    const mockCode = `MOCK_CODE_${Math.random().toString(36).substring(7)}`
    router.push(`/api/oauth/callback?code=${mockCode}&state=${state}`)
  }

  const handleDeny = () => {
    router.push(`/api/oauth/callback?error=access_denied&state=${state}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-primary">{platform.charAt(0)}</span>
          </div>
          <CardTitle className="text-2xl">Authorize Nexlin</CardTitle>
          <CardDescription className="pt-2">
            Nexlin is requesting access to your <strong>{platform}</strong> account to publish posts and view analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-bg-secondary/50 p-4 rounded-lg text-sm text-text-secondary border border-border">
            <p className="font-medium text-text-primary mb-2">This app will be able to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Read your profile information</li>
              <li>Publish posts on your behalf</li>
              <li>Read engagement metrics</li>
            </ul>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="w-full" onClick={handleDeny}>Deny</Button>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleAuthorize}>Allow Access</Button>
          </div>
          <p className="text-xs text-center text-text-secondary">
            Note: This is a mock consent screen because the real OAuth client keys are not set in the environment variables.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MockOAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-secondary">Loading...</div>}>
      <MockOAuthContent />
    </Suspense>
  )
}
