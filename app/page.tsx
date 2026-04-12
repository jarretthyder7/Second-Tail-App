"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, Users, ArrowRight, Menu, X, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const [activeView, setActiveView] = useState<"foster" | "rescue">("rescue")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [fosterName, setFosterName] = useState("")
  const [fosterEmail, setFosterEmail] = useState("")
  const [fosterCityZip, setFosterCityZip] = useState("")
  const [fosterAgree, setFosterAgree] = useState(false)
  const [fosterSubmitted, setFosterSubmitted] = useState(false)
  const [fosterLoading, setFosterLoading] = useState(false)
  const [fosterError, setFosterError] = useState<string | null>(null)

  const [rescueName, setRescueName] = useState("")
  const [rescueOrgName, setRescueOrgName] = useState("")
  const [rescueEmail, setRescueEmail] = useState("")
  const [rescueCityZip, setRescueCityZip] = useState("")
  const [rescueAgree, setRescueAgree] = useState(false)
  const [rescueSubmitted, setRescueSubmitted] = useState(false)
  const [rescueLoading, setRescueLoading] = useState(false)
  const [rescueError, setRescueError] = useState<string | null>(null)

  const handleFosterWaitlistSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!fosterAgree) return
    setFosterLoading(true)
    setFosterError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("waitlist").insert({
        name: fosterName,
        email: fosterEmail,
        city_zip: fosterCityZip,
        type: "foster",
      })
      if (error) throw error
      setFosterSubmitted(true)
    } catch {
      setFosterError("Something went wrong. Please try again.")
    } finally {
      setFosterLoading(false)
    }
  }

  const handleRescueWaitlistSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!rescueAgree) return
    setRescueLoading(true)
    setRescueError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("waitlist").insert({
        name: rescueName,
        email: rescueEmail,
        city_zip: rescueCityZip,
        type: "rescue",
        organization_name: rescueOrgName,
      })
      if (error) throw error
      setRescueSubmitted(true)
    } catch {
      setRescueError("Something went wrong. Please try again.")
    } finally {
      setRescueLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900">
              Second Tail
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                href="/for-rescue-organizations"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                For Rescue Organizations
              </Link>
              <Link
                href="/for-fosters"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                For Fosters
              </Link>
              <a
                href="#foster-waitlist"
                className="hidden"
              >
                Foster Sign-Up
              </a>
              <Link
                href="/login"
                className="text-sm font-medium text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-colors"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 space-y-3 border-t border-gray-100 mt-4">
              <Link
                href="/for-rescue-organizations"
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Rescue Organizations
              </Link>
              <Link
                href="/for-fosters"
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Fosters
              </Link>
              <a
                href="#foster-waitlist"
                className="hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                Foster Sign-Up
              </a>
              <Link
                href="/login"
                className="block text-center text-sm font-medium text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-colors"
                style={{ backgroundColor: "#D76B1A" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-11 lg:pt-16">
        <div className="text-center max-w-3xl mx-auto space-y-5 sm:space-y-6 lg:space-y-7">
          <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-gray-500 mb-3">
            Rescue Operations & Foster Coordination
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.15] tracking-tight max-w-2xl mx-auto px-2">
            Fostering and rescue, <span className="block sm:inline">made easier for everyone involved.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed font-normal max-w-2xl mx-auto px-2">
            Second Tail helps rescue organizations coordinate foster care with simple tools to communicate, track animal
            care, and support fosters.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Rescue Card - Now on the left */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 hover:shadow-2xl transition-all border-2 border-amber-200">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
              style={{ backgroundColor: "rgba(90, 74, 66, 0.15)" }}
            >
              <Users className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#5a4a42" }} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">For Rescue Organizations</h3>
            <p className="text-gray-700 text-base sm:text-lg mb-5 sm:mb-6 leading-relaxed">
              Streamline foster coordination. Simple tools to manage relationships, track care, and scale without
              burnout.
            </p>
            <Link
              href="/for-rescue-organizations"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 sm:py-3 text-white rounded-xl sm:rounded-lg font-semibold hover:opacity-90 transition-colors text-base sm:text-base"
              style={{ backgroundColor: "#5a4a42" }}
            >
              Learn More
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>

          {/* Foster Card - Now on the right */}
          <div
            className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 hover:shadow-2xl transition-all border-2"
            style={{ borderColor: "rgba(215, 107, 26, 0.2)" }}
          >
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
              style={{ backgroundColor: "rgba(215, 107, 26, 0.15)" }}
            >
              <Heart className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">For Foster Parents</h3>
            <p className="text-gray-700 text-base sm:text-lg mb-5 sm:mb-6 leading-relaxed">
              A simple dashboard to collaborate with your rescue organization. Track care, communicate easily, and get
              the support you need.
            </p>
            <Link
              href="/for-fosters"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 sm:py-3 text-white rounded-xl sm:rounded-lg font-semibold hover:opacity-90 transition-colors text-base sm:text-base"
              style={{ backgroundColor: "#D76B1A" }}
            >
              Learn More
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>

        <p className="text-center text-sm sm:text-base text-gray-500 pt-6 sm:pt-8">
          Already a member?{" "}
          <Link href="/login" className="text-gray-900 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-6 sm:mb-8 px-2">
          How Second Tail Works
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16 px-4">
          <button
            onClick={() => setActiveView("rescue")}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 rounded-xl sm:rounded-lg font-semibold transition-all text-base ${
              activeView === "rescue" ? "text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            style={activeView === "rescue" ? { backgroundColor: "#5a4a42" } : {}}
          >
            For Rescue Organizations
          </button>
          <button
            onClick={() => setActiveView("foster")}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 rounded-xl sm:rounded-lg font-semibold transition-all text-base ${
              activeView === "foster" ? "text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            style={activeView === "foster" ? { backgroundColor: "#D76B1A" } : {}}
          >
            For Foster Parents
          </button>
        </div>

        {activeView === "foster" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            <div className="text-center px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: "#D76B1A" }}
              >
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Get invited by your rescue</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Your rescue organization will send you an invitation link after you're approved to foster with them.
              </p>
            </div>
            <div className="text-center px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: "#D76B1A" }}
              >
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Access your dashboard</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Log in to see the animals you're fostering, upcoming appointments, and messages from your rescue team.
              </p>
            </div>
            <div className="text-center px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: "#D76B1A" }}
              >
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Collaborate and coordinate</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Track care, communicate with your rescue, and get the guidance you need to help your foster animal
                thrive.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            <div className="text-center px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: "#5a4a42" }}
              >
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Set up your organization</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Register your rescue, add team members, and customize your foster management system.
              </p>
            </div>
            <div className="text-center px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: "#5a4a42" }}
              >
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Invite and manage fosters</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Onboard foster parents, assign animals, and build a network of trusted caregivers.
              </p>
            </div>
            <div className="text-center px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: "#5a4a42" }}
              >
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Coordinate care at scale</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Track health records, schedule appointments, communicate efficiently, and focus on saving more lives.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
          {activeView === "foster" ? (
            <>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight px-2">
                Foster with confidence and support
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto px-2">
                Second Tail keeps you connected to your rescue team so you're never figuring it out alone.
              </p>
              <Link
                href="/login"
                className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-xl sm:rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-colors shadow-lg"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Login to Dashboard
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight px-2">
                Build a foster network that actually scales.
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto px-2">
                Second Tail helps rescue organizations coordinate care, reduce admin burden, and focus on what
                matters—saving more lives.
              </p>
              <Link
                href="/sign-up/rescue"
                className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-xl sm:rounded-lg font-semibold text-base sm:text-lg transition-colors shadow-lg"
                style={{ backgroundColor: "#5a4a42" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Register Your Organization
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="border-t border-gray-200 bg-gradient-to-br from-orange-50/40 to-amber-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Stay Connected
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Get notified when Second Tail launches in your area. Whether you&apos;re a foster parent or a rescue organization, we&apos;ll keep you in the loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Foster Waitlist Form */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(215, 107, 26, 0.15)" }}
                >
                  <Heart className="w-5 h-5" style={{ color: "#D76B1A" }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">For Foster Parents</h3>
                  <p className="text-sm text-gray-600">Get notified when rescues near you join</p>
                </div>
              </div>
              
              {fosterSubmitted ? (
                <div className="text-center py-6 space-y-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}
                  >
                    <CheckCircle2 className="w-7 h-7" style={{ color: "#D76B1A" }} />
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    {"You're on the list! We'll notify you when rescues near you go live."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFosterWaitlistSubmit} className="space-y-4">
                  {fosterError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {fosterError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fosterName}
                      onChange={(e) => setFosterName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{ "--tw-ring-color": "rgba(215, 107, 26, 0.4)" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={fosterEmail}
                      onChange={(e) => setFosterEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{ "--tw-ring-color": "rgba(215, 107, 26, 0.4)" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">City / ZIP Code</label>
                    <input
                      type="text"
                      required
                      value={fosterCityZip}
                      onChange={(e) => setFosterCityZip(e.target.value)}
                      placeholder="e.g. Austin, TX or 78701"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{ "--tw-ring-color": "rgba(215, 107, 26, 0.4)" } as React.CSSProperties}
                    />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fosterAgree}
                      onChange={(e) => setFosterAgree(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                      style={{ accentColor: "#D76B1A" }}
                    />
                    <span className="text-sm text-gray-600">
                      I agree to receive updates from Second Tail.{" "}
                      <Link href="/privacy" className="font-semibold hover:underline" style={{ color: "#D76B1A" }}>
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={!fosterAgree || fosterLoading}
                    className="w-full px-6 py-3.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: "#D76B1A" }}
                  >
                    {fosterLoading ? "Saving..." : "Notify Me"}
                  </button>
                </form>
              )}
            </div>

            {/* Rescue Organization Waitlist Form */}
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(90, 74, 66, 0.15)" }}
                >
                  <Users className="w-5 h-5" style={{ color: "#5a4a42" }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">For Rescue Organizations</h3>
                  <p className="text-sm text-gray-600">Get early access when we launch</p>
                </div>
              </div>
              
              {rescueSubmitted ? (
                <div className="text-center py-6 space-y-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "rgba(90, 74, 66, 0.12)" }}
                  >
                    <CheckCircle2 className="w-7 h-7" style={{ color: "#5a4a42" }} />
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    {"You're on the list! We'll reach out when we're ready to onboard your organization."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRescueWaitlistSubmit} className="space-y-4">
                  {rescueError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {rescueError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={rescueName}
                      onChange={(e) => setRescueName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{ "--tw-ring-color": "rgba(90, 74, 66, 0.4)" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={rescueOrgName}
                      onChange={(e) => setRescueOrgName(e.target.value)}
                      placeholder="Your rescue organization"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{ "--tw-ring-color": "rgba(90, 74, 66, 0.4)" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={rescueEmail}
                      onChange={(e) => setRescueEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{ "--tw-ring-color": "rgba(90, 74, 66, 0.4)" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">City / ZIP Code</label>
                    <input
                      type="text"
                      required
                      value={rescueCityZip}
                      onChange={(e) => setRescueCityZip(e.target.value)}
                      placeholder="e.g. Austin, TX or 78701"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                      style={{ "--tw-ring-color": "rgba(90, 74, 66, 0.4)" } as React.CSSProperties}
                    />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rescueAgree}
                      onChange={(e) => setRescueAgree(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                      style={{ accentColor: "#5a4a42" }}
                    />
                    <span className="text-sm text-gray-600">
                      I agree to receive updates from Second Tail.{" "}
                      <Link href="/privacy" className="font-semibold hover:underline" style={{ color: "#5a4a42" }}>
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={!rescueAgree || rescueLoading}
                    className="w-full px-6 py-3.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: "#5a4a42" }}
                  >
                    {rescueLoading ? "Saving..." : "Get Early Access"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-xs sm:text-sm text-gray-500">
            © 2026 Second Tail. Made with care for rescues and fosters.
          </div>
        </div>
      </footer>
    </div>
  )
}
