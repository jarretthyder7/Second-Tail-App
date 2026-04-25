"use client"

import type React from "react"
import { useState } from "react"
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

export default function RescueWaitlistPage() {
  const [orgName, setOrgName] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [zip, setZip] = useState("")
  const [city, setCity] = useState("")
  const [orgState, setOrgState] = useState("")
  const [website, setWebsite] = useState("")
  const [howHeard, setHowHeard] = useState("")
  const [notes, setNotes] = useState("")
  const [zipLoading, setZipLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!orgName.trim() || !contactName.trim() || !email.trim()) {
      setStatus("error")
      setError("Organization name, your name, and email are required.")
      return
    }

    setStatus("submitting")
    try {
      const res = await fetch("/api/rescue-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          contactName,
          email,
          phone,
          city,
          state: orgState,
          website,
          howHeard,
          notes,
        }),
      })
      if (res.ok) {
        setStatus("success")
        try {
          const ph = (window as any).posthog
          if (ph?.capture) {
            ph.capture("rescue_waitlist_submitted", {
              state: orgState,
              city,
              has_website: !!website,
              how_heard: howHeard || null,
            })
          }
        } catch {}
      } else {
        const data = await res.json().catch(() => ({}))
        setStatus("error")
        setError(data?.error || "Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setError("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF6EC]">

      {/* Top nav */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="text-lg font-bold text-gray-900">Second Tail</Link>
        <p className="text-sm text-gray-500">
          Already invited?{" "}
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
                Founding Rescues · Beta
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
                Your foster program,<br />
                <span className="text-[#D76B1A]">finally organized.</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Stop managing fosters over text threads and spreadsheets. Second Tail gives fosters a dedicated app to view their dog, submit requests, and log updates — and gives you one place to see everything.
              </p>
              <p className="text-base text-gray-600 leading-relaxed mt-3">
                We&apos;re onboarding founding rescues personally during beta. Free while we&apos;re in beta — no credit card, no commitment.
              </p>
            </div>

            {/* How it works — 3 steps */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">How it works</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D76B1A] text-white text-sm font-bold flex items-center justify-center">1</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Apply</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Tell us about your rescue and what you&apos;re hoping to fix.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D76B1A] text-white text-sm font-bold flex items-center justify-center">2</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">We reach out</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Within a few days. Quick call to make sure Second Tail is a fit for how your team works.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D76B1A] text-white text-sm font-bold flex items-center justify-center">3</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Get onboarded</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">We set up your org, import your animals, and walk your team through it. You&apos;re live the same week.</p>
                  </div>
                </div>
              </div>
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
              Free during beta · No credit card required
            </p>
          </div>

          {/* ── Right: Waitlist form ── */}
          <div className="lg:pt-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">

              {status === "success" ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re on the list.</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We&apos;ll be in touch within a few days to get your rescue set up. During beta we work with each org personally so we can learn from you.
                  </p>
                  <p className="text-sm text-gray-400 mt-6">
                    Questions in the meantime?{" "}
                    <a href="mailto:hello@getsecondtail.com" className="text-[#D76B1A] font-medium hover:underline">
                      Email us
                    </a>
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Apply to join</h2>
                  <p className="text-sm text-gray-500 mb-6">Founding rescues get hands-on onboarding and free access during beta.</p>

                  <form onSubmit={handleSubmit} className="space-y-4">

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
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Name *</label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Jane Smith"
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                          required
                        />
                      </div>
                    </div>

                    {/* Email + Phone */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email *</label>
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
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone (optional)</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(555) 123-4567"
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                        />
                      </div>
                    </div>

                    {/* Address — ZIP autopopulates city + state */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organization Location</label>
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
                          {US_STATES.map((s) => (
                            <option key={s} value={US_STATE_ABBRS[s]}>{US_STATE_ABBRS[s]}</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Enter ZIP code to auto-fill city and state</p>
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rescue Website (optional)</label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourrescue.org"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                      />
                    </div>

                    {/* How heard */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">How did you hear about us? (optional)</label>
                      <select
                        value={howHeard}
                        onChange={(e) => setHowHeard(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition"
                      >
                        <option value="">Select...</option>
                        <option value="foster">A foster told us</option>
                        <option value="social">Social media</option>
                        <option value="tossthebone">Toss the Bone</option>
                        <option value="referral">Another rescue</option>
                        <option value="search">Google / search</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Anything else? (optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="What's frustrating about how you manage fosters today? Anything you want us to know?"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/30 focus:border-[#D76B1A] transition resize-none"
                      />
                    </div>

                    {status === "error" && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">{error}</div>
                    )}

                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="w-full inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#D76B1A" }}
                    >
                      {status === "submitting" ? "Sending..." : "Apply to join"}
                    </button>

                    <p className="text-xs text-center text-gray-400">
                      By applying you agree to our{" "}
                      <Link href="/terms" className="underline hover:text-gray-600 transition">Terms</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="underline hover:text-gray-600 transition">Privacy Policy</Link>
                    </p>

                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
