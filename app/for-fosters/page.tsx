"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, MessageCircle, Calendar, Shield, CheckCircle, Menu, X } from "lucide-react"

export default function ForFostersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FBF8F4" }}>
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900">
                Second Tail
              </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                href="/for-fosters"
                className="text-sm font-medium text-gray-900 border-b-2"
                style={{ borderColor: "#D76B1A" }}
              >
                For Fosters
              </Link>
              <Link href="/for-rescue-organizations" className="text-sm font-medium text-gray-700 hover:text-gray-900">
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
                className="block px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Fosters
              </Link>
              <Link
                href="/for-rescue-organizations"
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Rescue Organizations
              </Link>
              <Link
                href="/login"
                className="block text-center text-sm font-medium text-white px-5 py-2.5 rounded-lg"
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
            <Heart className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#D76B1A" }} />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight px-2">
            Collaborate with your rescue organization
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
            Second Tail is a dashboard used with your rescue organization to communicate, coordinate care, and track
            updates for the animals you foster.
          </p>
          <div className="pt-4 sm:pt-6">
            <p className="text-base text-gray-600 mb-4">Foster access is provided by your rescue organization</p>
            <Link
              href="/login"
              className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-xl sm:rounded-lg font-semibold hover:opacity-90 transition-colors shadow-lg"
              style={{ backgroundColor: "#D76B1A" }}
            >
              Login to Your Account
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8 sm:mb-12 text-center px-2">
          What you can do with Second Tail
        </h2>
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
          <div className="rounded-2xl p-6 sm:p-8 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Easy communication</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Message your rescue team directly, get answers fast, and keep everything in one place.
            </p>
          </div>
          <div className="rounded-2xl p-6 sm:p-8 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Coordinated care</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Track vet appointments, medications, and daily updates. Your rescue team can see what's happening without
              constant check-ins.
            </p>
          </div>
          <div className="rounded-2xl p-6 sm:p-8 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Support when you need it</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Have a question at 9pm? Need help with a behavior issue? Your rescue team is just a message away, no guilt
              required.
            </p>
          </div>
          <div className="rounded-2xl p-6 sm:p-8 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Guidance throughout</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              From your first foster to your tenth, you'll have clear guidance, care plans, and a team backing you every
              step of the way.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 px-2">You're not fostering alone</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed px-2">
            Second Tail helps you stay connected with your rescue organization, track care details, and get support when
            you need it—all in one simple dashboard.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 px-2">
          Interested in fostering?
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-6 px-2">
          Contact a rescue organization in your area. They'll invite you to join Second Tail once you're approved.
        </p>
        <Link
          href="/login"
          className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-xl sm:rounded-lg font-semibold hover:opacity-90 transition-colors shadow-lg"
          style={{ backgroundColor: "#D76B1A" }}
        >
          Already have an account? Log in
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
