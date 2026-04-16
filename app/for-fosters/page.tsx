"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Heart, MessageCircle, Calendar, Shield, CheckCircle, Menu, X, FileText, Clock, Package, AlertCircle, Users, ChevronDown } from "lucide-react"

export default function ForFostersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSignupOpen, setMobileSignupOpen] = useState(false)
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false)

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
                href="/login/foster"
                className="text-sm font-medium text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-colors"
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
            <div className="md:hidden pt-4 pb-3 border-t border-gray-100 mt-4 space-y-3">

              {/* CTA Buttons: Sign Up + Login at the top */}
              <div className="flex flex-col gap-2 px-1">
                {/* Sign Up dropdown */}
                <div>
                  <button
                    onClick={() => { setMobileSignupOpen(!mobileSignupOpen); setMobileLoginOpen(false) }}
                    className="flex items-center justify-between w-full px-5 py-3 rounded-full font-semibold text-sm border-2 transition-colors hover:bg-orange-50"
                    style={{ borderColor: "#D76B1A", color: "#D76B1A" }}
                  >
                    <span>Sign Up</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileSignupOpen ? "rotate-180" : ""}`} />
                  </button>
                  {mobileSignupOpen && (
                    <div className="mt-1.5 mx-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <Link
                        href="/sign-up/foster"
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-orange-50 transition-colors"
                        onClick={() => { setMobileMenuOpen(false); setMobileSignupOpen(false) }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                          <Heart className="w-4 h-4" style={{ color: "#D76B1A" }} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Foster Parent</div>
                          <div className="text-xs text-gray-500">Create your account</div>
                        </div>
                      </Link>
                      <div className="h-px bg-gray-100 mx-4" />
                      <Link
                        href="/sign-up/rescue"
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-amber-50 transition-colors"
                        onClick={() => { setMobileMenuOpen(false); setMobileSignupOpen(false) }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(80, 64, 43, 0.12)" }}>
                          <Users className="w-4 h-4" style={{ color: "#50402B" }} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Rescue Org</div>
                          <div className="text-xs text-gray-500">Create your account</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Login dropdown */}
                <div>
                  <button
                    onClick={() => { setMobileLoginOpen(!mobileLoginOpen); setMobileSignupOpen(false) }}
                    className="flex items-center justify-between w-full px-5 py-3 rounded-full font-semibold text-sm text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: "#D76B1A" }}
                  >
                    <span>Login</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileLoginOpen ? "rotate-180" : ""}`} />
                  </button>
                  {mobileLoginOpen && (
                    <div className="mt-1.5 mx-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <Link
                        href="/login/foster"
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-orange-50 transition-colors"
                        onClick={() => { setMobileMenuOpen(false); setMobileLoginOpen(false) }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                          <Heart className="w-4 h-4" style={{ color: "#D76B1A" }} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Foster Parent</div>
                          <div className="text-xs text-gray-500">Login to your dashboard</div>
                        </div>
                      </Link>
                      <div className="h-px bg-gray-100 mx-4" />
                      <Link
                        href="/login/rescue"
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-amber-50 transition-colors"
                        onClick={() => { setMobileMenuOpen(false); setMobileLoginOpen(false) }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(80, 64, 43, 0.12)" }}>
                          <Users className="w-4 h-4" style={{ color: "#50402B" }} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Rescue Org</div>
                          <div className="text-xs text-gray-500">Login to your dashboard</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 mx-1" />

              {/* Learn More section */}
              <div className="px-1">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Learn More</p>
                <div className="space-y-0.5">
                  <Link
                    href="/for-fosters"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-900 bg-gray-50 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(215, 107, 26, 0.1)" }}>
                      <Heart className="w-3.5 h-3.5" style={{ color: "#D76B1A" }} />
                    </div>
                    For Fosters
                  </Link>
                  <Link
                    href="/for-rescue-organizations"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(80, 64, 43, 0.1)" }}>
                      <Users className="w-3.5 h-3.5" style={{ color: "#50402B" }} />
                    </div>
                    For Rescue Organizations
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-[#FDF6EC] rounded-2xl">
        <div className="text-center space-y-4 sm:space-y-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: "#F7E2BD" }}
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#D76B1A" }} />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight px-2">
            Collaborate with your rescue organization
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
            Sign up free, build your foster profile, and connect with rescue organizations in your area.
          </p>
          <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up/foster"
              className="inline-block w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-5 text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-colors shadow-lg"
              style={{ backgroundColor: "#D76B1A" }}
            >
              Sign Up to Foster
            </Link>
            <Link
              href="/login/foster"
              className="inline-block w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-5 border-2 rounded-full font-semibold text-sm sm:text-base transition-colors"
              style={{ borderColor: "#D76B1A", color: "#D76B1A" }}
            >
              Already a member? Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-[#FDF6EC] rounded-2xl">
        <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-8 sm:mb-12 text-center px-2">
          What you can do with Second Tail
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">View your assigned animal's profile and care plan</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              See details about the dog you're fostering, medical history, and specific care instructions.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Log daily updates and notes</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Track progress, note behaviors, and log any concerns. Your rescue team stays informed without having to ask.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <Package className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Request supplies from your rescue org</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Need food, toys, or medical supplies? Request them directly and track what's on the way.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Request and track appointments</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Schedule vet visits, check-ins, and pickup appointments. See everything on one calendar.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Message your rescue team directly</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Have a question at 9pm? Get answers fast without the group chat. Your rescue team is here to help.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Access emergency contacts and resources 24/7</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Have a health or behavioral emergency? Get immediate access to emergency contacts and critical resources.
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
          Ready to get started?
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-6 px-2">
          Create your foster profile today and start connecting with rescue organizations in your area.
        </p>
          <Link
            href="/sign-up/foster"
            className="inline-block w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-5 text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-colors shadow-lg"
            style={{ backgroundColor: "#D76B1A" }}
          >
            Sign Up to Foster
          </Link>
      </section>

      <footer className="border-t border-gray-200 bg-[#D76B1A] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-xs sm:text-sm text-white/80">
            © 2026 Second Tail. Made with care for rescues and fosters.
          </div>
        </div>
      </footer>
    </div>
  )
}
