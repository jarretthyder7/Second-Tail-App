"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, MessageCircle, Clipboard, Shield, Menu, X, Mail, Plus, Clock, DollarSign, Users2, FileUp } from "lucide-react"

export default function ForRescueOrganizationsPage() {
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
                href="/login/rescue"
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
              Request Early Access
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#50402B" }}>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#50402B" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Foster coordination</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              See all your fosters in one place. Track who's caring for which dogs, who's available, and who needs
              support. No more spreadsheet chaos.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#50402B" }}>
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#50402B" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Communication & updates</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Message fosters one-on-one or send org-wide updates. No more group texts.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#50402B" }}>
            <Clipboard className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#50402B" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Care tracking</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Every vet visit, medication, and daily log in one place. Accessible by your whole team.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#50402B" }}>
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#50402B" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Collaboration across teams</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Add coordinators, medical staff, and volunteers. Everyone sees what they need to.
            </p>
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
          className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-xl sm:rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-colors shadow-lg"
          style={{ backgroundColor: "#50402B" }}
        >
          Request Early Access
        </Link>
      </section>

      <footer className="border-t border-gray-700 bg-[#3D2B1F] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-xs sm:text-sm text-gray-400">
            © 2026 Second Tail. Made with care for rescues and fosters.
          </div>
        </div>
      </footer>
    </div>
  )
}
