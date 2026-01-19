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

const Heart = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7Z" />
  </svg>
)

export default function FosterLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      console.log("[v0] Attempting to sign in with email:", email)

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Sign in response:", { data, error: signInError })

      if (signInError) {
        console.error("[v0] Sign in error:", signInError)
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setError("Unable to log in. Please try again.")
        setIsLoading(false)
        return
      }

      console.log("[v0] User signed in:", data.user.id)

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
        .single()

      console.log("[v0] Profile query result:", { profile, profileError })

      if (profileError || !profile) {
        setError("Unable to load user profile. Please try again.")
        setIsLoading(false)
        return
      }

      if (profile.role !== "foster") {
        setError("This account is not a foster account. Please use Rescue Team Login.")
        setIsLoading(false)
        return
      }

      console.log("[v0] Redirecting to dashboard...")

      if (profile.organization_id) {
        router.push(`/org/${profile.organization_id}/foster/dashboard`)
      } else {
        router.push("/foster/dashboard")
      }
    } catch (err) {
      console.error("[v0] Login exception:", err)
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

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
            rgba(215, 107, 26, 0.1) 0%,
            transparent 50%
          ),
          radial-gradient(
            circle at 20% 70%,
            rgba(247, 226, 189, 0.08) 0%,
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
      <div className="absolute top-24 left-16 w-64 h-64 opacity-[0.08] pointer-events-none hidden md:block" 
        style={{
          background: 'radial-gradient(circle, rgba(215, 107, 26, 0.3) 0%, transparent 70%)',
          borderRadius: '45% 55% 52% 48% / 48% 45% 55% 52%',
          filter: 'blur(40px)',
        }}
      />

      <div className="absolute bottom-40 right-16 w-72 h-72 opacity-[0.07] pointer-events-none hidden lg:block" 
        style={{
          background: 'radial-gradient(circle, rgba(247, 226, 189, 0.4) 0%, transparent 70%)',
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
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center mb-3 md:mb-4">
            <Heart className="w-5 h-5 md:w-6 md:h-6 text-primary-orange" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-bark" style={{ fontFamily: "Lora, serif" }}>
            Welcome back
          </h1>
          <p className="text-sm md:text-base text-text-secondary">Log in to your Foster account</p>
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
                className="text-xs text-primary-orange hover:text-secondary-rust font-medium transition"
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
            {isLoading ? "Logging in..." : "Log in as Foster"}
          </button>

          <p className="text-xs text-center text-text-tertiary pt-2">
            Need access? Contact your rescue organization for an invitation.
          </p>
        </form>
      </div>
    </div>
  )
}
