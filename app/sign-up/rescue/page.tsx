"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const US_STATE_ABBRS: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH",
  "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
  "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA",
  "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN",
  Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA",
  "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
}
const US_STATES = Object.keys(US_STATE_ABBRS)

export default function RescueSignUpPage() {
  const [orgName, setOrgName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [zip, setZip] = useState("")
  const [city, setCity] = useState("")
  const [orgState, setOrgState] = useState("")
  const [zipLoading, setZipLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleZipChange = async (value: string) => {
    setZip(value)
    if (value.length === 5 && /^\d{5}$/.test(value)) {
      setZipLoading(true)
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${value}`)
        if (res.ok) {
          const data = await res.json()
          const place = data.places?.[0]
          if (place) {
            setCity(place["place name"])
            setOrgState(place["state abbreviation"] || "")
          }
        }
      } catch {}
      setZipLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (!orgName.trim()) {
      setError("Please enter your organization name before continuing with Google.")
      return
    }
    if (!adminName.trim()) {
      setError("Please enter your name before continuing with Google.")
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const intent = btoa(
        JSON.stringify({
          role: "rescue",
          org_role: "org_admin",
          orgName: orgName.trim(),
          adminName: adminName.trim(),
          city: city.trim(),
          state: orgState.trim(),
          zip: zip.trim(),
        })
      )

      await fetch("/api/auth/store-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
      })

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
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
            city,
            state: orgState,
            zip,
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
                Stop managing fosters over text threads and spreadsheets. Second Tail gives fosters a dedicated app to view their dog, submit requests, and log updates — and gives you one place to see everything.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#D76B1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Foster dog profiles</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Every foster sees a live profile for their dog — care notes, history, and updates the moment you add them</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#D76B1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Requests handled in-app</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Fosters submit supply requests, vet appointments, and reimbursements — you approve, done. No more texts</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#D76B1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Complete care tracking</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Daily logs, vet records, and behavior notes organized automatically for every dog in your program</p>
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

            <p className="text-sm text-gray-400 text-center">
              Free to get started · No credit card required
            </p>
          </div>

          {/* ── Right: Sign-up form ── */}
          <div className="lg:pt-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">

              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
              <p className="text-sm text-gray-500 mb-6">Get your rescue set up in minutes — it&apos;s free.</p>

              <form onSubmit={handleEmailSignUp} className="space-y-4">

                {/* Org + admin name */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organization Name *</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Second Tail Rescue"
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

                {/* Email + Phone */}
                <div className="grid sm:grid-cols-2 gap-3">
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
                </div>

                {/* Address — ZIP autopopulates city + state */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organization Location *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={zip}
                        onChange={(e) => handleZipChange(e.target.value)}
                        placeholder="ZIP"
                        maxLength={5}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                      />
                      {zipLoading && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <div className="w-3 h-3 border-2 border-[#D76B1A] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                    />
                    <select
                      value={orgState}
                      onChange={(e) => setOrgState(e.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                    >
                      <option value="">State</option>
                      {US_STATES.map(s => (
                        <option key={s} value={US_STATE_ABBRS[s]}>{US_STATE_ABBRS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Enter ZIP code to auto-fill city and state</p>
                </div>

                {/* Password */}
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
                  className="w-full inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#D76B1A" }}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>

                <p className="text-xs text-center text-gray-400">
                  By signing up you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-gray-600 transition">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="underline hover:text-gray-600 transition">Privacy Policy</Link>
                </p>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">or sign up with Google</span>
                  </div>
                </div>

                {/* Google button — at the bottom after all info is collected */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
