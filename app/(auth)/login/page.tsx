"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      totpCode: needsTwoFactor ? totpCode : undefined,
    })

    if (result?.error) {
      if (result.error === "TOO_MANY_ATTEMPTS") {
        setError("Too many sign-in attempts. Please wait 15 minutes and try again.")
        setLoading(false)
        return
      }
      if (result.error === "2FA_REQUIRED") {
        setNeedsTwoFactor(true)
        setError("")
        setLoading(false)
        return
      }
      if (result.error === "INVALID_2FA_CODE") {
        setNeedsTwoFactor(true)
        setError("Invalid 6-digit authenticator or recovery code. Please try again.")
        setLoading(false)
        return
      }
      setError(
        result.error === "CredentialsSignin"
          ? "Invalid email or password."
          : "Authentication failed. Please try again."
      )
      setLoading(false)
    } else {
      const res = await fetch("/api/auth/session")
      const session = await res.json()

      const targetPath =
        session?.user?.isPlatformAdmin && !session?.user?.isImpersonating
          ? "/platform"
          : "/dashboard"
      window.location.href = targetPath
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        {needsTwoFactor ? "Two-Factor Verification" : "Welcome back"}
      </h1>
      <p className="text-text-secondary mb-8">
        {needsTwoFactor
          ? "Enter the 6-digit code from your authenticator app or a recovery backup code."
          : "Enter your credentials to access your account."}
      </p>

      {error && <div className="mb-4 text-red-500 text-sm font-medium">{error}</div>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {!needsTwoFactor ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="password">Password</label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="totpCode">Authenticator or Recovery Code</label>
            <Input
              id="totpCode"
              name="totpCode"
              type="text"
              placeholder="123456 or XXXX-XXXX"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => {
                setNeedsTwoFactor(false)
                setTotpCode("")
                setError("")
              }}
              className="text-xs text-primary hover:underline mt-1"
            >
              Use a different account
            </button>
          </div>
        )}

        <Button className="w-full mt-6" type="submit" disabled={loading}>
          {loading
            ? "Verifying..."
            : needsTwoFactor
              ? "Verify & Sign In"
              : "Sign In"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline font-medium">Sign up</Link>
      </p>
    </div>
  )
}
