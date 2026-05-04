"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

// Landing page for Supabase invite-link clicks. The invite email links to
// `/auth/invite#access_token=...&type=invite`; the browser supabase client
// auto-parses the hash and stores the session. The rescue then sets a
// password, after which we finalize their account (org + profile) via metadata
// already attached at invite time.
export default function InviteLandingPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<"checking" | "ready" | "saving" | "done" | "error">("checking")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [email, setEmail] = useState<string>("")
  const [orgName, setOrgName] = useState<string>("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    let cancelled = false
    async function run() {
      const supabase = createClient()
      // Give the implicit-flow detector a tick to parse the hash. If we read
      // the session before parsing finishes we'll miss it.
      await new Promise((r) => setTimeout(r, 50))
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session?.user) {
        setPhase("error")
        setErrorMsg("This invite link looks expired or invalid. Ask the admin to resend it.")
        return
      }
      setEmail(session.user.email || "")
      const meta = (session.user.user_metadata || {}) as Record<string, unknown>
      setOrgName(typeof meta.org_name === "string" ? meta.org_name : "")
      setPhase("ready")
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords don't match.")
      return
    }

    setPhase("saving")
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      const finalizeRes = await fetch("/api/auth/finalize-rescue-invite", { method: "POST" })
      const finalizeBody = await finalizeRes.json().catch(() => ({}))
      if (!finalizeRes.ok) {
        throw new Error(finalizeBody.error || "Failed to finalize account")
      }

      setPhase("done")
      const orgId = finalizeBody.organizationId as string | undefined
      if (orgId) {
        router.push(`/org/${orgId}/admin/dashboard`)
      } else {
        router.push("/login/rescue")
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong. Please try again.")
      setPhase("ready")
    }
  }

  if (phase === "checking") {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center p-6">
        <p className="text-[#5A4A42]">Verifying your invite…</p>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <h1 className="font-bold text-[#5A4A42] text-lg mb-2">Invite link issue</h1>
          <p className="text-sm text-[#5A4A42]/70">{errorMsg}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#5A4A42] mb-1">Welcome to Second Tail</h1>
        {orgName ? (
          <p className="text-sm text-[#5A4A42]/70 mb-6">
            Setting up <span className="font-semibold">{orgName}</span> for {email}.
          </p>
        ) : (
          <p className="text-sm text-[#5A4A42]/70 mb-6">Set a password to finish your account ({email}).</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#5A4A42] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-[#E8DDD1] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#5A4A42] mb-1">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-[#E8DDD1] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]"
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={phase === "saving"}
            className="w-full bg-[#D76B1A] text-white font-semibold py-2.5 rounded-lg hover:bg-[#C05A0A] transition disabled:opacity-50"
          >
            {phase === "saving" ? "Setting up your account…" : "Set password & continue"}
          </button>
        </form>
      </div>
    </div>
  )
}
