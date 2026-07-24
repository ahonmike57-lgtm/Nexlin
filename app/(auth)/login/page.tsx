"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (result?.error) {
      setError("Invalid email or password.")
      setLoading(false)
    } else {
      const res = await fetch("/api/auth/session")
      const session = await res.json()
      
      if (session?.user?.isPlatformAdmin) {
        router.push("/platform")
      } else {
        router.push("/dashboard")
      }
      
      router.refresh()
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
      <p className="text-text-secondary mb-8">Enter your credentials to access your account.</p>
      
      {error && <div className="mb-4 text-red-500 text-sm font-medium">{error}</div>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <Input id="email" name="email" type="email" placeholder="name@company.com" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button className="w-full mt-6" type="submit" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>
      
      <p className="mt-8 text-center text-sm text-text-secondary">
        Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline font-medium">Sign up</Link>
      </p>
    </div>
  )
}
