"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { registerUser } from "@/app/actions/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const company = formData.get("company") as string
    const email = formData.get("email") as string
    const passwordHash = formData.get("password") as string

    const result = await registerUser({ firstName, lastName, company, email, passwordHash })

    if (result.success) {
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password: passwordHash,
      })

      if (signInResult?.error) {
        setError("Account created, but failed to log in.")
        setLoading(false)
      } else {
        router.push("/onboarding")
      }
    } else {
      setError(result.error || "Failed to register")
      setLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Create an account</h1>
      <p className="text-text-secondary mb-8">Start your 14-day free trial. No credit card required.</p>
      
      {error && <div className="mb-4 text-red-500 text-sm font-medium">{error}</div>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="firstName">First name</label>
            <Input id="firstName" name="firstName" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="lastName">Last name</label>
            <Input id="lastName" name="lastName" required />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="company">Company name</label>
          <Input id="company" name="company" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">Work email</label>
          <Input id="email" name="email" type="email" placeholder="name@company.com" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">Password</label>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button className="w-full mt-6" type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
      
      <div className="mt-8 text-center text-sm text-text-secondary">
        Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </div>
    </div>
  )
}
