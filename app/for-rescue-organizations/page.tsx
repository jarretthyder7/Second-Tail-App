"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Users, MessageCircle, Menu, X, Mail, Plus, Clock, DollarSign, Users2, FileUp, Briefcase, Calendar, Package, AlertCircle, Heart, ChevronDown } from "lucide-react"

export default function ForRescueOrganizationsPage() {
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
                href="/login/rescue"
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
                      <div className="h-px bg-gray-100 mx-4" />
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
                      <div className="h-px bg-gray-100 mx-4" />
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
                    href="/for-rescue-organizations"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-900 bg-gray-50 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(80, 64, 43, 0.1)" }}>
                      <Users className="w-3.5 h-3.5" style={{ color: "#50402B" }} />
                    </div>
                    For Rescue Organizations
                  </Link>
                  <Link
                    href="/for-fosters"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(215, 107, 26, 0.1)" }}>
                      <Heart className="w-3.5 h-3.5" style={{ color: "#D76B1A" }} />
                    </div>
                    For Fosters
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
            <Users className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#50402B" }} />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight px-2">
            Built to support the people doing the hardest work.
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
            Second Tail gives rescue organizations simple tools to manage fosters, track dog care, and keep everyone
            aligned—without spreadsheets and group texts.
          </p>
          <div className="pt-4 sm:pt-6">
            <Link
              href="/sign-up/rescue"
              className="inline-block w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-5 text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-colors shadow-lg"
              style={{ backgroundColor: "#50402B" }}
            >
              Create Your Account
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: "#FDF6EC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-xl sm:text-2xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to manage rescue operations
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for rescue organizations and foster parents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#D76B1A" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Foster Management</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Invite fosters by email. Assign them animals. Track who&apos;s caring for what dog.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#50402B" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(80, 64, 43, 0.12)" }}>
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#50402B" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Appointment Scheduling</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Vet visits, check-ins, drop-offs. One calendar, no more group texts.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#D76B1A" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                <Package className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Supply Requests</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Fosters request supplies. You approve. Done.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#50402B" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(80, 64, 43, 0.12)" }}>
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#50402B" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Reimbursements</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Foster paid out of pocket? Handle it without the paperwork.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#D76B1A" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Team Messaging</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Message individual fosters or your whole team. No more group chat chaos.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#50402B" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(80, 64, 43, 0.12)" }}>
                <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#50402B" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Emergency Support</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Fosters get emergency contacts and resources 24/7 when they need help fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="bg-[#FDF6EC] py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-12 text-center px-2">
            What&apos;s included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Foster invitations</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <FileUp className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Animal profiles</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Appointment calendar</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Supply request management</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Reimbursement tracking</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Team chat</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <FileUp className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Data import from spreadsheets</span>
            </div>
            <div className="flex items-start gap-3 p-4">
              <Users2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-gray-900 font-semibold">Mobile-friendly foster dashboard</span>
            </div>
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
            className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-full font-semibold text-base sm:text-lg hover:opacity-90 transition-colors shadow-lg"
          style={{ backgroundColor: "#50402B" }}
        >
          Request Early Access
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
