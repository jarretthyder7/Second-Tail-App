"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { rescueLogin } from "./actions"

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

    const result = await rescueLogin(email, password)

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
              style={{ backgroundColor: "rgba(90, 74, 66, 0.12)" }}
            >
              <Users className="w-6 h-6" style={{ color: "#5a4a42" }} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Rescue team login
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Access your organization dashboard
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
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
                  style={{ "--tw-ring-color": "rgba(90, 74, 66, 0.3)" } as React.CSSProperties}
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
                  style={{ "--tw-ring-color": "rgba(90, 74, 66, 0.3)" } as React.CSSProperties}
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
                  style={{ accentColor: "#5a4a42" }}
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
                style={{ backgroundColor: "#5a4a42" }}
              >
                {isLoading ? "Logging in..." : "Log in to dashboard"}
              </button>
            </form>
          </div>

          {/* Footer links */}
          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up/rescue"
                className="font-semibold hover:opacity-80 transition"
                style={{ color: "#D76B1A" }}
              >
                Register your rescue
              </Link>
            </p>
            <p className="text-xs text-gray-400">
              Foster parent?{" "}
              <Link
                href="/login/foster"
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
