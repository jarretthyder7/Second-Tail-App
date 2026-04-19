"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function RescueSignUpPage() {
  const [orgName, setOrgName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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
          redirectTo: `${window.location.origin}/auth/callback?signupIntent=${intent}`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError("Could not sign up with Google. Please try again.")
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!orgName.trim()) { setError("Organization name is required"); setIsLoading(false); return }
    if (!adminName.trim()) { setError("Your name is required"); setIsLoading(false); return }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email address"); setIsLoading(false); return }
    if (password.length < 6) { setError("Password must be at least 6 characters"); setIsLoading(false); return }
    if (password !== repeatPassword) { setError("Passwords do not match"); setIsLoading(false); return }

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: adminName,
            role: "rescue",
            org_role: "org_admin",
            org_name: orgName,
            phone,
          },
        },
      })
      if (signUpError) throw signUpError

      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "welcome-rescue", email, orgName, adminName }),
        })
      } catch {}

      window.location.href = `/auth/sign-up-success?type=rescue&email=${encodeURIComponent(email)}`
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF6EC]">

      {/* Top nav */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="text-lg font-bold text-gray-900">Second Tail</Link>
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login/rescue" className="font-semibold text-[#D76B1A] hover:opacity-80 transition">
            Log in
          </Link>
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* ── Left: Visual pitch ── */}
          <div className="space-y-10 lg:sticky lg:top-8">

            <div>
              <span className="inline-block px-3 py-1 bg-[#D76B1A]/10 text-[#D76B1A] text-xs font-bold rounded-full uppercase tracking-wide mb-4">
                For Rescue Organizations
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
                Your foster program,<br />
                <span className="text-[#D76B1A]">finally organized.</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Stop managing fosters over text threads and spreadsheets. Second Tail gives your team one place to track every dog, every foster, and every update — so you can focus on saving lives.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#D76B1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Instant messaging</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Chat with every foster directly — no more text threads</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#D76B1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Care tracking</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Daily logs, vet records, and behavior notes — all organized</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#D76B1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Foster matching</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Find the right home for every dog, fast</p>
              </div>
            </div>

            {/* Dashboard screenshot */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
              <img
                src="/demo/rescue-desktop.png"
                alt="Second Tail rescue dashboard"
                className="w-full object-cover"
              />
            </div>

            {/* Social proof */}
            <p className="text-sm text-gray-400 text-center">
              Free to get started · No credit card required
            </p>
          </div>

          {/* ── Right: Sign-up form ── */}
          <div className="lg:pt-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">

              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
              <p className="text-sm text-gray-500 mb-6">Get your rescue set up in minutes — it&apos;s free.</p>

              {/* Org + admin name first (needed for Google path too) */}
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organization Name *</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Happy Paws Rescue"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Name *</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                  />
                </div>
              </div>

              {/* Google button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
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
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400">or sign up with email</span>
                </div>
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailSignUp} className="space-y-3">

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Work Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rescue.org"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password *</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password *</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="w-4 h-4"
                    style={{ accentColor: "#D76B1A" }}
                  />
                  <span className="text-xs text-gray-500">Show password</span>
                </label>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                  style={{ backgroundColor: "#D76B1A" }}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>

                <p className="text-xs text-center text-gray-400 pt-1">
                  By signing up you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-gray-600 transition">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="underline hover:text-gray-600 transition">Privacy Policy</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
