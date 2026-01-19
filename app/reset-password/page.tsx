"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const Lock = (props: React.SVGProps<SVGSVGElement>) => (
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
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user has a valid session from the reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.")
      }
    })
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4A90A4]/5 via-[#FBF8F4] to-[#FF8B7B]/5 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 space-y-6 md:space-y-8">
        <div className="space-y-2 md:space-y-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#4A90A4]/10 flex items-center justify-center mb-3 md:mb-4">
            <Lock className="w-5 h-5 md:w-6 md:h-6 text-[#4A90A4]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora, serif" }}>
            Reset your password
          </h1>
          <p className="text-sm md:text-base text-[#2E2E2E]/70">Enter your new password below.</p>
        </div>

        {success ? (
          <div className="p-4 md:p-5 bg-[#4A90A4]/10 border border-[#4A90A4]/30 text-[#5A4A42] rounded-xl">
            <p className="text-sm md:text-base font-medium mb-2">Password updated!</p>
            <p className="text-xs md:text-sm text-[#2E2E2E]/70">
              Your password has been successfully reset. Redirecting you to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-[#5A4A42] mb-2">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-xl border border-[#E5D5B7] bg-white px-3 md:px-4 py-2.5 md:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/40 focus:border-[#4A90A4] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-[#5A4A42] mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
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
              {isLoading ? "Updating..." : "Update password"}
            </button>

            <p className="text-xs text-center text-[#2E2E2E]/60 pt-2">
              Remember your password?{" "}
              <Link href="/login" className="text-[#4A90A4] hover:underline font-semibold">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
