"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldAlert, KeyRound, Smartphone, Check, Copy, AlertCircle, ShieldCheck, Lock } from "lucide-react"
import { generateTwoFactorSetup, enableTwoFactor, changeUserPassword } from "@/app/actions/security"

export default function SecuritySettingsPage() {
  // Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordStatus, setPasswordStatus] = useState<{ loading: boolean; error?: string; success?: string }>({ loading: false })

  // 2FA Setup State
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; otpAuthUrl: string; backupCodes: string[] } | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorStatus, setTwoFactorStatus] = useState<{ loading: boolean; error?: string; success?: string }>({ loading: false })
  const [copiedKey, setCopiedKey] = useState(false)

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ loading: false, error: "New passwords do not match." })
      return
    }
    setPasswordStatus({ loading: true })
    try {
      const res = await changeUserPassword(currentPassword, newPassword)
      if (res.success) {
        setPasswordStatus({ loading: false, success: "Password successfully updated!" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setShowPasswordModal(false), 2000)
      } else {
        setPasswordStatus({ loading: false, error: res.error || "Failed to update password" })
      }
    } catch (err: any) {
      setPasswordStatus({ loading: false, error: err.message || "Failed to update password" })
    }
  }

  // Handle 2FA Setup Start
  const handleStartTwoFactor = async () => {
    setTwoFactorStatus({ loading: true })
    try {
      const setup = await generateTwoFactorSetup()
      setTwoFactorSetup(setup)
      setTwoFactorStatus({ loading: false })
    } catch (err: any) {
      setTwoFactorStatus({ loading: false, error: err.message || "Failed to initialize 2FA setup" })
    }
  }

  // Handle 2FA Verification and Activation
  const handleVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!twoFactorSetup || !verificationCode) return

    setTwoFactorStatus({ loading: true })
    try {
      const res = await enableTwoFactor(verificationCode, twoFactorSetup.secret, twoFactorSetup.backupCodes)
      if (res.success) {
        setTwoFactorEnabled(true)
        setTwoFactorStatus({ loading: false, success: "2FA successfully activated!" })
      } else {
        setTwoFactorStatus({ loading: false, error: res.error || "Invalid 6-digit code. Please try again." })
      }
    } catch (err: any) {
      setTwoFactorStatus({ loading: false, error: err.message || "Verification failed" })
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1 text-text-primary">Security Settings</h2>
        <p className="text-sm text-text-secondary">Manage password credentials, two-factor authentication, and account access policies.</p>
      </div>

      {/* Password Management Card */}
      <Card className="border border-border bg-bg-primary shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <KeyRound className="w-5 h-5 text-primary" /> Password Authentication
          </CardTitle>
          <CardDescription className="text-xs text-text-secondary">
            Ensure your account uses a long, unique password with numbers and symbols.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordModal ? (
            <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
              Change Password
            </Button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-3 p-4 rounded-xl border border-border bg-bg-secondary/40 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              {passwordStatus.error && (
                <p className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {passwordStatus.error}
                </p>
              )}
              {passwordStatus.success && (
                <p className="text-xs text-emerald-500 flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5" /> {passwordStatus.success}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={passwordStatus.loading}>
                  {passwordStatus.loading ? "Updating..." : "Save New Password"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Card */}
      <Card className="border border-border bg-bg-primary shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <Smartphone className="w-5 h-5 text-primary" /> Two-Factor Authentication (TOTP)
          </CardTitle>
          <CardDescription className="text-xs text-text-secondary">
            Protect your agency account with Google Authenticator, 1Password, or Authy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorEnabled ? (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">2FA Protection is Active</p>
                  <p className="text-xs text-text-secondary">Your account requires a 6-digit TOTP token upon login.</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                Enabled
              </span>
            </div>
          ) : !twoFactorSetup ? (
            <Button onClick={handleStartTwoFactor} disabled={twoFactorStatus.loading}>
              {twoFactorStatus.loading ? "Generating Secret..." : "Enable 2FA Protection"}
            </Button>
          ) : (
            <div className="space-y-4 p-4 rounded-xl border border-border bg-bg-secondary/40 animate-in fade-in">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-primary">Step 1: Add to Authenticator App</p>
                <p className="text-xs text-text-secondary">
                  Open your authenticator app (Google Authenticator, 1Password, or Authy) and enter this manual setup key:
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-primary border border-border font-mono text-xs font-bold text-primary">
                  <span className="tracking-wider flex-1 truncate">{twoFactorSetup.secret}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(twoFactorSetup.secret)
                      setCopiedKey(true)
                      setTimeout(() => setCopiedKey(false), 2000)
                    }}
                    className="text-text-secondary hover:text-text-primary text-xs flex items-center gap-1 font-sans"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Emergency Backup Codes */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <p className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" /> Emergency Single-Use Recovery Codes
                </p>
                <p className="text-[11px] text-text-secondary">
                  Save these 8 recovery codes in a safe password manager. If you lose your phone, each code can be used once to access your account:
                </p>
                <div className="grid grid-cols-4 gap-1.5 p-2 rounded-lg bg-bg-primary border border-border font-mono text-[11px] text-center font-bold text-text-secondary">
                  {twoFactorSetup.backupCodes.map((code) => (
                    <div key={code} className="p-1 rounded bg-bg-secondary/60">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Verification Input */}
              <form onSubmit={handleVerifyTwoFactor} className="space-y-3 pt-2 border-t border-border">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-primary">Step 2: Enter 6-Digit Code from App</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    className="w-48 px-3 py-2 text-center tracking-widest font-mono text-base font-bold rounded-lg border border-border bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="000000"
                  />
                </div>

                {twoFactorStatus.error && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {twoFactorStatus.error}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={twoFactorStatus.loading || verificationCode.length < 6}>
                    {twoFactorStatus.loading ? "Verifying..." : "Verify & Activate 2FA"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setTwoFactorSetup(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-red-500/20 bg-red-500/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-red-600 dark:text-red-400">
            <ShieldAlert className="w-5 h-5" /> Danger Zone
          </CardTitle>
          <CardDescription className="text-xs text-text-secondary">
            Permanently delete your agency workspace, contacts, funnels, and billing wallets. This action is irreversible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="danger">Delete Agency Workspace</Button>
        </CardContent>
      </Card>
    </div>
  )
}
