"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, MessageCircle, Clipboard, Shield, ArrowLeft, Menu, X } from "lucide-react"

export default function ForRescueOrganizationsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FBF8F4" }}>
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Back to home">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Link>
              <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900">
                Second Tail
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link href="/for-fosters" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                For Fosters
              </Link>
              <Link
                href="/for-rescue-organizations"
                className="text-sm font-medium text-gray-900 border-b-2"
                style={{ borderColor: "#50402B" }}
              >
                For Rescue Organizations
              </Link>
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
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 space-y-3 border-t border-gray-100 mt-4">
              <Link
                href="/for-fosters"
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Fosters
              </Link>
              <Link
                href="/for-rescue-organizations"
                className="block px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Rescue Organizations
              </Link>
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

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center space-y-4 sm:space-y-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: "#F7E2BD" }}
          >
            <Users className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#50402B" }} />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight px-2">
            Built to support the people doing the hardest work.
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
            Second Tail gives rescue organizations simple tools to manage fosters, track dog care, and keep everyone
            aligned—without spreadsheets and group texts.
          </p>
          <div className="pt-4 sm:pt-6">
            <Link
              href="/sign-up/rescue"
              className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-xl sm:rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-colors shadow-lg"
              style={{ backgroundColor: "#50402B" }}
            >
              Register Your Organization
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
          <div className="rounded-2xl p-6 sm:p-8 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#50402B" }}>
            <Users className="w-8 h-8 sm:w-10 sm:h-10 mb-4" style={{ color: "#50402B" }} />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Foster coordination</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              See all your fosters in one place. Track who's caring for which dogs, who's available, and who needs
              support. No more spreadsheet chaos.
            </p>
          </div>
          <div className="rounded-2xl p-6 sm:p-8 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#50402B" }}>
            <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 mb-4" style={{ color: "#50402B" }} />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Communication & updates</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Message fosters directly or send group updates. Keep everyone informed without endless text threads or
              lost messages. Second Tail ensures timely communication, reducing delays in care and fostering a more
              responsive team.
            </p>
          </div>
          <div className="rounded-2xl p-6 sm:p-8 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#50402B" }}>
            <Clipboard className="w-8 h-8 sm:w-10 sm:h-10 mb-4" style={{ color: "#50402B" }} />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Care tracking</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Track medical records, appointments, medications, and daily updates. All the information you need to make
              good decisions, fast. Second Tail's care tracking system is intuitive and easy to use, ensuring that no
              critical details are missed.
            </p>
          </div>
          <div className="rounded-2xl p-6 sm:p-8 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#50402B" }}>
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 mb-4" style={{ color: "#50402B" }} />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Collaboration across teams</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Add team members, assign roles, and keep everyone aligned. From foster coordinators to medical teams,
              everyone stays in sync. Second Tail promotes seamless teamwork, enhancing coordination and efficiency.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 px-2">
            This saves you time. This reduces chaos.
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed px-2">
            Your team is stretched thin. Second Tail doesn't add more to your plate—it clears it. Simple tools that help
            you scale without burnout.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center space-y-6 sm:space-y-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 px-2">
          Ready to streamline your rescue operations?
        </h2>
        <Link
          href="/sign-up/rescue"
          className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-xl sm:rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-colors shadow-lg"
          style={{ backgroundColor: "#50402B" }}
        >
          Register Your Organization
        </Link>
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
