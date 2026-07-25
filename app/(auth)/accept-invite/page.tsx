"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyAdminInviteCode, completeAdminSignup } from "@/app/actions/admin"
import { toast } from "sonner"
import { KeyRound, ShieldCheck, ArrowRight, Loader2, Lock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialEmail = searchParams.get("email") || ""
  const initialCode = searchParams.get("code") || ""

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)

  // Step 1 State
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState(initialCode)

  // Step 2 State (Populated upon verification)
  const [verifiedRole, setVerifiedRole] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isCompleted, setIsCompleted] = useState(false)

  // Sync state if URL query parameters update
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail)
    if (initialCode) setCode(initialCode)

    if (initialEmail && initialCode) {
      handleVerifyCode(initialEmail, initialCode)
    }
  }, [initialEmail, initialCode])

  const handleVerifyCode = async (verifyEmail?: string, verifyCode?: string) => {
    const e = verifyEmail || email
    const c = verifyCode || code

    if (!e || !c) {
      toast.error("Please enter both your email address and 6-digit code.")
      return
    }

    setLoading(true)
    try {
      const res = await verifyAdminInviteCode({ email: e, code: c })
      if (res.success && res.data) {
        setVerifiedRole(res.data.role)
        if (res.data.name) setName(res.data.name)
        setStep(2)
        toast.success("Verification code confirmed! Complete your admin account setup.")
      } else {
        toast.error(res.error || "Failed to verify invitation code.")
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter your full name.")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const res = await completeAdminSignup({ email, code, name, password })
      if (res.success) {
        setIsCompleted(true)
        toast.success("Platform Admin account activated successfully!")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        toast.error(res.error || "Failed to complete signup.")
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred during signup.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Branding */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Platform Admin Acceptance
        </h1>
        <p className="text-sm text-text-secondary">
          Accept your administrative invitation to join the platform team.
        </p>
      </div>

      {isCompleted ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Account Activated!</h2>
          <p className="text-sm text-text-secondary">
            Your Platform Admin account is active. Redirecting you to login...
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      ) : step === 1 ? (
        /* Step 1: Verification Form */
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-bg-secondary border border-border flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs text-text-secondary">
              Enter the email address and 6-digit verification code provided by your Platform Owner.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Email Address</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">6-Digit Verification Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 482910"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border rounded-xl text-lg font-mono tracking-widest text-center text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <button
              type="button"
              onClick={() => handleVerifyCode()}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Set Password & Name */
        <form onSubmit={handleCompleteSignup} className="space-y-4">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold text-success truncate">{email}</span>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
              {verifiedRole}
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Create Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Lock className="w-4 h-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Lock className="w-4 h-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl border border-border text-text-secondary font-medium text-sm hover:bg-bg-secondary transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {!loading && "Activate Account"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
