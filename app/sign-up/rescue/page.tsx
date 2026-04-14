"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
)

const Check = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export default function RescueSignUpPage() {
  const [orgName, setOrgName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            name: adminName,
            role: "rescue",
            org_role: "org_admin",
            org_name: orgName,
            phone: phone,
          },
        },
      })

      if (signUpError) throw signUpError

      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "welcome-rescue",
            email: email,
            orgName: orgName,
            adminName: adminName,
          }),
        })
      } catch (emailError) {
        console.warn("[v0] Welcome email failed to send:", emailError)
        // Don't fail signup if email fails
      }

      router.push("/auth/sign-up-success?type=rescue")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (!orgName.trim()) {
      setError("Please enter your organization name before continuing with Google.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      const intent = btoa(
        JSON.stringify({
          role: "rescue",
          org_role: "org_admin",
          orgName: orgName.trim(),
          adminName: adminName.trim(),
        })
      )

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
            state: intent,
          },
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-clay via-neutral-cream to-neutral-clay">
      {/* Header */}
      <div className="border-b border-neutral-sand bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-bark" style={{ fontFamily: "Lora, serif" }}>
            Second Tail
          </Link>
          <Link href="/login/rescue" className="text-sm font-medium text-bark hover:text-primary-orange transition">
            Already have an account? <span className="font-semibold">Log in →</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left side - Value Proposition */}
          <div className="space-y-8 lg:sticky lg:top-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-bark hover:text-primary-orange transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <div className="space-y-4">
              <div className="inline-block px-4 py-1.5 bg-primary-orange/10 text-primary-orange text-xs font-semibold rounded-full">
                FOR RESCUE ORGANIZATIONS
              </div>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight"
                style={{ fontFamily: "Lora, serif" }}
              >
                Streamline your foster program
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed">
                Join rescue organizations who trust our platform to manage foster relationships, track dog care, and
                focus on what matters most—saving lives.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-orange/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-orange" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Real-time foster communication</h3>
                  <p className="text-sm text-text-secondary/70">
                    Message fosters directly, share updates, and respond to requests instantly—all in one place
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-orange/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-orange" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Complete care tracking</h3>
                  <p className="text-sm text-text-secondary/70">
                    Daily logs, medical records, and behavioral notes automatically organized for every dog
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-orange/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-orange" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Reduce administrative burden</h3>
                  <p className="text-sm text-text-secondary/70">
                    Spend less time on paperwork, more time on mission-critical work
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-orange/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-orange" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Team collaboration tools</h3>
                  <p className="text-sm text-text-secondary/70">
                    Keep your entire team aligned with shared dashboards and internal messaging
                  </p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="pt-8 border-t border-neutral-sand">
              <p className="text-sm text-text-tertiary">Trusted by rescue organizations nationwide</p>
            </div>
          </div>

          {/* Right side - Sign Up Form */}
          <div className="lg:pt-16">
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-sand p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "Lora, serif" }}>
                  Create Your Account
                </h2>
                <p className="text-sm text-text-secondary">
                  Sign up to get started managing your rescue organization.
                </p>
              </div>

              <button
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-3 rounded-xl border-2 border-neutral-sand px-4 py-3 text-sm font-semibold text-bark hover:bg-neutral-cream transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-sand"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-text-tertiary">Or sign up with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-bark mb-2">Organization Name *</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Second Tail Rescue"
                      className="w-full rounded-xl border border-neutral-sand bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40 focus:border-primary-orange transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-bark mb-2">Your Name *</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full rounded-xl border border-neutral-sand bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40 focus:border-primary-orange transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-bark mb-2">Work Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rescue.org"
                    className="w-full rounded-xl border border-neutral-sand bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40 focus:border-primary-orange transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-bark mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-xl border border-neutral-sand bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40 focus:border-primary-orange transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-bark mb-2">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border border-neutral-sand bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40 focus:border-primary-orange transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-bark mb-2">Confirm Password *</label>
                  <input
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-neutral-sand bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40 focus:border-primary-orange transition"
                    required
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-primary-orange px-6 py-3.5 text-base font-semibold text-white hover:bg-secondary-rust transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>

                <p className="text-xs text-center text-text-tertiary">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-text-secondary transition-colors">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-text-secondary transition-colors">
                    Privacy Policy
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
