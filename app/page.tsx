"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ArrowRight, Heart, Users, Calendar, MessageSquare, Package, ClipboardList, CheckCircle2 } from "lucide-react"

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"rescue" | "foster">("rescue")
  const [submitted, setSubmitted] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const handleWaitlistSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!agreeToTerms) return
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#F7E2BD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-[#5A4A42]">
              Second Tail
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-[#5A4A42] hover:opacity-70 transition-opacity">
                Features
              </a>
              <a href="#for-both" className="text-sm text-[#5A4A42] hover:opacity-70 transition-opacity">
                Solutions
              </a>
              <a
                href="#waitlist"
                className="px-5 py-2.5 rounded-lg bg-[#D76B1A] text-white text-sm font-semibold hover:bg-[#D76B1A]/90 transition-colors"
              >
                Get Early Access
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[#F7E2BD] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 space-y-3 border-t border-[#F7E2BD] mt-4">
              <a
                href="#features"
                className="block px-4 py-2 text-sm text-[#5A4A42] hover:bg-[#F7E2BD]/20 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#for-both"
                className="block px-4 py-2 text-sm text-[#5A4A42] hover:bg-[#F7E2BD]/20 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Solutions
              </a>
              <a
                href="#waitlist"
                className="block text-center text-sm font-semibold text-white px-5 py-2.5 rounded-lg bg-[#D76B1A] hover:bg-[#D76B1A]/90 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Early Access
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-40">
        <div className="text-center space-y-8 sm:space-y-10 max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#2E2E2E] leading-[1.1] text-balance">
            Fostering and rescue, made easier for everyone involved.
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-[#5A4A42] leading-relaxed">
            Second Tail gives rescue organizations and foster parents one place to manage dogs, appointments, care plans, and communication.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4 sm:pt-6">
            <a
              href="#waitlist"
              className="px-8 py-4 sm:py-3.5 rounded-lg bg-[#5A4A42] text-white font-semibold hover:bg-[#5A4A42]/90 transition-colors text-center"
            >
              Join as a Rescue Org
            </a>
            <a
              href="#waitlist"
              className="px-8 py-4 sm:py-3.5 rounded-lg border-2 border-[#D76B1A] text-[#D76B1A] font-semibold hover:bg-[#D76B1A]/5 transition-colors text-center"
            >
              Join as a Foster Parent
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 border-t border-[#F7E2BD]">
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2E2E2E]">Everything your rescue needs, in one place</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {[
            {
              icon: Users,
              title: "Dog Management",
              desc: "Track every dog's profile, care plan, and foster history",
            },
            {
              icon: Heart,
              title: "Foster Coordination",
              desc: "Invite fosters, assign dogs, and manage your whole network",
            },
            {
              icon: Calendar,
              title: "Appointments",
              desc: "Schedule vet visits, home checks, and meet & greets",
            },
            {
              icon: MessageSquare,
              title: "Messaging",
              desc: "Real-time communication between staff and foster parents",
            },
            {
              icon: Package,
              title: "Supply Requests",
              desc: "Fosters request what they need, admins fulfill it",
            },
            {
              icon: ClipboardList,
              title: "Care Plans",
              desc: "Medications, feeding schedules, and vet info always accessible",
            },
          ].map((feature, idx) => (
            <div key={idx} className="space-y-4 p-6 sm:p-8 rounded-2xl border border-[#F7E2BD] hover:border-[#D76B1A]/30 hover:bg-[#F7E2BD]/20 transition-all">
              <feature.icon className="w-8 h-8 text-[#D76B1A]" />
              <h3 className="text-xl sm:text-2xl font-semibold text-[#2E2E2E]">{feature.title}</h3>
              <p className="text-base sm:text-lg text-[#5A4A42]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For Both Audiences Section */}
      <section id="for-both" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
          {/* Rescue Orgs Card */}
          <div className="p-8 sm:p-10 lg:p-12 rounded-3xl border-2 border-[#F7E2BD] bg-[#FBF8F4]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#5A4A42] text-white flex items-center justify-center mb-6 sm:mb-8">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-[#2E2E2E] mb-6">For Rescue Organizations</h3>
            <ul className="space-y-4 sm:space-y-5 mb-8 sm:mb-10">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-[#5A4A42] flex-shrink-0 mt-0.5" />
                <span className="text-base sm:text-lg text-[#5A4A42]">Scale foster networks without burnout</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-[#5A4A42] flex-shrink-0 mt-0.5" />
                <span className="text-base sm:text-lg text-[#5A4A42]">Centralize all animal data and care coordination</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-[#5A4A42] flex-shrink-0 mt-0.5" />
                <span className="text-base sm:text-lg text-[#5A4A42]">Save hundreds of hours on admin every month</span>
              </li>
            </ul>
            <a
              href="#waitlist"
              className="inline-block w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-[#5A4A42] text-white font-semibold rounded-lg hover:bg-[#5A4A42]/90 transition-colors text-center"
            >
              Request Early Access
            </a>
          </div>

          {/* Foster Parents Card */}
          <div className="p-8 sm:p-10 lg:p-12 rounded-3xl border-2 border-[#D76B1A]/30 bg-[#FFF8F3]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#D76B1A] text-white flex items-center justify-center mb-6 sm:mb-8">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-[#2E2E2E] mb-6">For Foster Parents</h3>
            <ul className="space-y-4 sm:space-y-5 mb-8 sm:mb-10">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-[#D76B1A] flex-shrink-0 mt-0.5" />
                <span className="text-base sm:text-lg text-[#5A4A42]">Stay connected to your rescue team</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-[#D76B1A] flex-shrink-0 mt-0.5" />
                <span className="text-base sm:text-lg text-[#5A4A42]">Access care plans and medical records anytime</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-[#D76B1A] flex-shrink-0 mt-0.5" />
                <span className="text-base sm:text-lg text-[#5A4A42]">Never miss an appointment or update</span>
              </li>
            </ul>
            <a
              href="#waitlist"
              className="inline-block w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-[#D76B1A] text-white font-semibold rounded-lg hover:bg-[#D76B1A]/90 transition-colors text-center"
            >
              Join as a Foster
            </a>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 border-t border-[#F7E2BD]">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-[#2E2E2E] mb-4">Be the first to know when we launch</h2>
          <p className="text-lg sm:text-xl text-[#5A4A42]">Join rescue organizations and foster parents who are ready to change the game.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 sm:gap-4 justify-center mb-8 sm:mb-10">
          <button
            onClick={() => setActiveTab("rescue")}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === "rescue"
                ? "bg-[#5A4A42] text-white"
                : "bg-[#F7E2BD] text-[#5A4A42] hover:bg-[#F7E2BD]/80"
            }`}
          >
            I&apos;m a Rescue Org
          </button>
          <button
            onClick={() => setActiveTab("foster")}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === "foster"
                ? "bg-[#D76B1A] text-white"
                : "bg-[#F7E2BD] text-[#5A4A42] hover:bg-[#F7E2BD]/80"
            }`}
          >
            I&apos;m a Foster Parent
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleWaitlistSubmit} className="bg-[#FBF8F4] rounded-2xl p-8 sm:p-10 space-y-6 sm:space-y-7">
          {submitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-center text-sm sm:text-base font-medium">
              You&apos;re on the list! We&apos;ll be in touch soon.
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#2E2E2E] mb-2">Name</label>
            <input
              type="text"
              required
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg border border-[#F7E2BD] focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] text-[#2E2E2E]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2E2E2E] mb-2">Email</label>
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-lg border border-[#F7E2BD] focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] text-[#2E2E2E]"
            />
          </div>

          <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-[#F7E2BD] hover:border-[#D76B1A]/30 transition-colors">
            <input
              type="checkbox"
              required
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded accent-[#D76B1A]"
            />
            <span className="text-sm sm:text-base text-[#5A4A42]">
              I agree to receive updates from Second Tail. We&apos;ll never spam you or share your data.{" "}
              <Link href="/privacy" className="text-[#D76B1A] hover:underline font-semibold">
                View our Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={!agreeToTerms}
            className="w-full px-6 py-4 sm:py-3.5 bg-[#D76B1A] text-white font-semibold rounded-lg hover:bg-[#D76B1A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base sm:text-lg"
          >
            Get Early Access
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#F7E2BD] py-12 sm:py-16 mt-20 sm:mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-12 sm:mb-16">
            <div>
              <h3 className="font-bold text-[#2E2E2E] text-lg mb-2">Second Tail</h3>
              <p className="text-sm sm:text-base text-[#5A4A42]">Making rescue and foster care simpler, together.</p>
            </div>
            <div>
              <h4 className="font-semibold text-[#2E2E2E] text-sm mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-[#5A4A42] hover:text-[#D76B1A] transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-[#5A4A42] hover:text-[#D76B1A] transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#2E2E2E] text-sm mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-[#5A4A42] hover:text-[#D76B1A] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-[#5A4A42] hover:text-[#D76B1A] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#F7E2BD] pt-8 sm:pt-10 text-center text-sm text-[#5A4A42]">
            © 2026 Second Tail. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
