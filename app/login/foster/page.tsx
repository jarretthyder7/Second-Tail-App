"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { fosterLogin } from "./actions"
import { SiteHeader } from "@/components/site-header"
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
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("code")

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
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
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
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
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
          href="/"
          className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-bark hover:text-primary-orange transition"
        >
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          Back to Home
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

        {inviteCode && (
          <div className="p-3 md:p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs md:text-sm">
            You have a pending invitation. Log in to accept and join the rescue organization.
          </div>
        )}

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
      <SiteFooter />
    </div>
  )
}
