"use client"

import type React from "react"

import { useState } from "react"
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

const Mail = (props: React.SVGProps<SVGSVGElement>) => (
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
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4A90A4]/5 via-[#FBF8F4] to-[#FF8B7B]/5 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 space-y-6 md:space-y-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-[#5A4A42] hover:text-[#D76B1A] transition"
        >
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          Back to login
        </Link>

        <div className="space-y-2 md:space-y-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#4A90A4]/10 flex items-center justify-center mb-3 md:mb-4">
            <Mail className="w-5 h-5 md:w-6 md:h-6 text-[#4A90A4]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora, serif" }}>
            Forgot password?
          </h1>
          <p className="text-sm md:text-base text-[#2E2E2E]/70">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        {success ? (
          <div className="p-4 md:p-5 bg-[#4A90A4]/10 border border-[#4A90A4]/30 text-[#5A4A42] rounded-xl">
            <p className="text-sm md:text-base font-medium mb-2">Check your email!</p>
            <p className="text-xs md:text-sm text-[#2E2E2E]/70">
              We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your
              password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-[#5A4A42] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-[#E5D5B7] bg-white px-3 md:px-4 py-2.5 md:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/40 focus:border-[#4A90A4] transition"
                required
              />
            </div>

            {error && (
              <div className="p-3 md:p-4 bg-[#D97A68]/10 border border-[#D97A68]/30 text-[#D97A68] rounded-xl text-xs md:text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center rounded-full bg-[#4A90A4] px-5 md:px-6 py-3 md:py-3.5 text-sm md:text-base font-semibold text-white hover:bg-[#4A90A4]/90 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
