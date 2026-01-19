"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

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

const Users = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export default function RescueLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setError("Unable to log in. Please try again.")
        setIsLoading(false)
        return
      }

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true")
        localStorage.setItem("rememberMeEmail", email)
      } else {
        localStorage.removeItem("rememberMe")
        localStorage.removeItem("rememberMeEmail")
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, organization_id")
        .eq("id", data.user.id)
        .maybeSingle()

      if (profileError) {
        console.error("[v0] Profile fetch error:", profileError)
        setError("Unable to load user profile. Please try again.")
        setIsLoading(false)
        return
      }

      if (!profile) {
        console.error("[v0] No profile found for user:", data.user.id)
        setError("No profile found. Please contact your organization administrator.")
        setIsLoading(false)
        return
      }

      if (profile.role !== "rescue") {
        setError("This account is not a rescue team account. Please use Foster Login.")
        setIsLoading(false)
        return
      }

      if (profile.organization_id) {
        router.push(`/org/${profile.organization_id}/admin/dashboard`)
      } else {
        setError("No organization assigned to this account.")
        setIsLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      console.log("[v0] Initiating Google OAuth...")
      console.log("[v0] Origin:", window.location.origin)
      console.log("[v0] Redirect URL:", `${window.location.origin}/auth/callback`)

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      console.log("[v0] OAuth response data:", data)
      console.log("[v0] OAuth error:", signInError)

      if (signInError) {
        console.error("[v0] Google OAuth failed:", signInError)
        if (signInError.message.includes("provider") || signInError.message.includes("not enabled")) {
          setError("Google sign-in is not configured yet. Please use email login or contact support.")
        } else {
          setError(`Google sign-in failed: ${signInError.message}`)
        }
        setIsLoading(false)
        return
      }

      if (!data?.url) {
        console.error("[v0] No OAuth URL returned from Supabase")
        setError("Google sign-in is not properly configured. Please use email login.")
        setIsLoading(false)
        return
      }

      console.log("[v0] Redirecting to Google OAuth URL:", data.url)
      // OAuth will redirect, so we keep loading state
    } catch (err) {
      console.error("[v0] Google OAuth exception:", err)
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{
        // Modern multi-layer background
        background: `
          radial-gradient(
            circle at 50% 30%,
            rgba(90, 74, 66, 0.09) 0%,
            transparent 50%
          ),
          radial-gradient(
            circle at 15% 75%,
            rgba(215, 107, 26, 0.06) 0%,
            transparent 45%
          ),
          linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.4),
            rgba(247, 226, 189, 0.25)
          ),
          var(--brand-bg, #F8F5F0)
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Subtle noise overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.1) 2px,
              rgba(0, 0, 0, 0.1) 4px
            )
          `,
        }}
      />

      {/* Soft decorative blobs */}
      <div className="absolute top-28 left-20 w-72 h-72 opacity-[0.08] pointer-events-none hidden md:block" 
        style={{
          background: 'radial-gradient(circle, rgba(90, 74, 66, 0.25) 0%, transparent 70%)',
          borderRadius: '45% 55% 52% 48% / 48% 45% 55% 52%',
          filter: 'blur(40px)',
        }}
      />

      <div className="absolute bottom-44 right-12 w-80 h-80 opacity-[0.07] pointer-events-none hidden lg:block" 
        style={{
          background: 'radial-gradient(circle, rgba(215, 107, 26, 0.3) 0%, transparent 70%)',
          borderRadius: '52% 48% 45% 55% / 55% 52% 48% 45%',
          filter: 'blur(50px)',
        }}
      />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 space-y-6 md:space-y-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-bark hover:text-primary-orange transition"
        >
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          Back
        </Link>

        <div className="space-y-2 md:space-y-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-bark/10 flex items-center justify-center mb-3 md:mb-4">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-bark" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-bark" style={{ fontFamily: "Lora, serif" }}>
            Rescue Team Login
          </h1>
          <p className="text-sm md:text-base text-text-secondary">Access your organization dashboard</p>
        </div>

        <button
          onClick={handleGoogleLogin}
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
            <span className="bg-white px-2 text-text-tertiary">Or log in with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-bark mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-neutral-sand bg-white px-3 md:px-4 py-2.5 md:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40 focus:border-primary-orange transition"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs md:text-sm font-semibold text-bark">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary-orange hover:text-bark font-medium transition"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-neutral-sand bg-white px-3 md:px-4 py-2.5 md:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40 focus:border-primary-orange transition"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-sand bg-white cursor-pointer accent-primary-orange"
            />
            <label htmlFor="rememberMe" className="text-xs md:text-sm text-text-secondary cursor-pointer">
              Remember me on this device
            </label>
          </div>

          {error && (
            <div className="p-3 md:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs md:text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center rounded-full bg-primary-orange px-5 md:px-6 py-3 md:py-3.5 text-sm md:text-base font-semibold text-white hover:bg-primary-orange/90 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Log in as Rescue Team"}
          </button>

          <p className="text-xs text-center text-text-tertiary pt-2">
            Only rescue organization staff should use this portal.
          </p>
        </form>
      </div>
    </div>
  )
}
