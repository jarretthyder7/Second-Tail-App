"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { rescueLogin } from "./actions"
import { SiteFooter } from "@/components/site-footer"

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
      router.push(result.redirectTo)
    }
  }

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
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
      <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 space-y-6 md:space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-bark hover:text-primary-orange transition"
        >
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          Back to Home
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
      <SiteFooter />
    </div>
  )
}
