"use client"

import type React from "react"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { fosterLogin } from "./actions"

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

function FosterLoginContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("code")
  const message = searchParams.get("message")

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      // Use server-side OAuth initiation to ensure PKCE cookies are set correctly
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to initiate Google sign-in")
      }
      
      // Redirect to Google OAuth
      window.location.href = data.url
    } catch (err) {
      setError("Could not sign in with Google. Please try again.")
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (rememberMe) {
      localStorage.setItem("rememberMe", "true")
      localStorage.setItem("rememberMeEmail", email)
    } else {
      localStorage.removeItem("rememberMe")
      localStorage.removeItem("rememberMeEmail")
    }

    const result = await fosterLogin(email, password, inviteCode)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else if (result?.redirectTo) {
      window.location.href = result.redirectTo
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF8F4] flex flex-col">

      {/* Minimal top bar */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="text-lg font-bold text-gray-900">
          Second Tail
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Icon + headline above card */}
          <div className="text-center mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}
            >
              <Heart className="w-6 h-6" style={{ color: "#D76B1A" }} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Log in to your foster dashboard
            </p>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm">
              {message}
            </div>
          )}

          {inviteCode && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
              You have a pending invitation. Log in to accept and join the rescue organization.
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">

            {/* Google sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-5"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ "--tw-ring-color": "rgba(215, 107, 26, 0.35)" } as React.CSSProperties}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium hover:opacity-80 transition"
                    style={{ color: "#D76B1A" }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ "--tw-ring-color": "rgba(215, 107, 26, 0.35)" } as React.CSSProperties}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "#D76B1A" }}
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-500 cursor-pointer">
                  Remember me on this device
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ backgroundColor: "#D76B1A" }}
              >
                {isLoading ? "Logging in..." : "Log in to dashboard"}
              </button>
            </form>
          </div>

          {/* Footer links */}
          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-gray-500">
              New to fostering?{" "}
              <Link
                href="/sign-up/foster"
                className="font-semibold hover:opacity-80 transition"
                style={{ color: "#D76B1A" }}
              >
                Create a free account
              </Link>
            </p>
            <p className="text-xs text-gray-400">
              Rescue team?{" "}
              <Link
                href="/login/rescue"
                className="font-medium text-gray-500 hover:text-gray-900 transition"
              >
                Log in here instead
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function FosterLoginPage() {
  return (
    <Suspense fallback={null}>
      <FosterLoginContent />
    </Suspense>
  )
}
