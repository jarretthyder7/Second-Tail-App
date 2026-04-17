"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Heart, Users, Menu, X, ChevronDown } from "lucide-react"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false)
  const [signupDropdownOpen, setSignupDropdownOpen] = useState(false)

  const loginDropdownRef = useRef<HTMLDivElement>(null)
  const signupDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(e.target as Node)) {
        setLoginDropdownOpen(false)
      }
      if (signupDropdownRef.current && !signupDropdownRef.current.contains(e.target as Node)) {
        setSignupDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50" style={{ borderBottomColor: "rgba(90, 74, 66, 0.1)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">Second Tail</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
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

            <div className="relative" ref={loginDropdownRef}>
              <button
                onClick={() => { setLoginDropdownOpen(!loginDropdownOpen); setSignupDropdownOpen(false) }}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${loginDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {loginDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  <Link
                    href="/login/rescue"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors"
                    onClick={() => setLoginDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(90, 74, 66, 0.12)" }}>
                      <Users className="w-3.5 h-3.5" style={{ color: "#5a4a42" }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Rescue Org</div>
                      <div className="text-xs text-gray-500 font-normal">Login to your dashboard</div>
                    </div>
                  </Link>
                  <div className="h-px bg-gray-100" />
                  <Link
                    href="/login/foster"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 transition-colors"
                    onClick={() => setLoginDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                      <Heart className="w-3.5 h-3.5" style={{ color: "#D76B1A" }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Foster Parent</div>
                      <div className="text-xs text-gray-500 font-normal">Login to your dashboard</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <div className="relative" ref={signupDropdownRef}>
              <button
                onClick={() => { setSignupDropdownOpen(!signupDropdownOpen); setLoginDropdownOpen(false) }}
                className="flex items-center gap-1.5 text-sm font-medium text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-colors shadow-sm"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Sign Up
                <ChevronDown className={`w-4 h-4 transition-transform ${signupDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {signupDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  <Link
                    href="/sign-up/rescue"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors"
                    onClick={() => setSignupDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(90, 74, 66, 0.12)" }}>
                      <Users className="w-3.5 h-3.5" style={{ color: "#5a4a42" }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Rescue Org</div>
                      <div className="text-xs text-gray-500 font-normal">Create your account</div>
                    </div>
                  </Link>
                  <div className="h-px bg-gray-100" />
                  <Link
                    href="/sign-up/foster"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 transition-colors"
                    onClick={() => setSignupDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                      <Heart className="w-3.5 h-3.5" style={{ color: "#D76B1A" }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Foster Parent</div>
                      <div className="text-xs text-gray-500 font-normal">Create your account</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
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
          <div className="md:hidden pt-5 pb-4 border-t border-gray-100 mt-4 space-y-5">

            {/* Sign-up cards (primary action) */}
            <div className="space-y-2.5 px-1">
              {/* Rescue Org card - primary (orange filled) */}
              <div
                className="rounded-2xl p-4 text-white shadow-sm"
                style={{ backgroundColor: "#D76B1A" }}
              >
                <Link
                  href="/sign-up/rescue"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 hover:opacity-95 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/20">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">Register Your Rescue</div>
                    <div className="text-xs text-white/80">Manage your foster network</div>
                  </div>
                </Link>
                <div className="flex justify-end mt-1">
                  <Link
                    href="/for-rescue-organizations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-medium text-white/90 hover:text-white underline-offset-2 hover:underline"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>

              {/* Foster card - secondary (orange outlined) */}
              <div
                className="rounded-2xl p-4 border-2"
                style={{ borderColor: "#D76B1A" }}
              >
                <Link
                  href="/sign-up/foster"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}
                  >
                    <Heart className="w-5 h-5" style={{ color: "#D76B1A" }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base text-gray-900">Sign Up to Foster</div>
                    <div className="text-xs text-gray-500">Connect with rescues near you</div>
                  </div>
                </Link>
                <div className="flex justify-end mt-1">
                  <Link
                    href="/for-fosters"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-medium hover:underline underline-offset-2"
                    style={{ color: "#D76B1A" }}
                  >
                    Learn more →
                  </Link>
                </div>
              </div>
            </div>

            {/* Quiet login row */}
            <div className="px-1">
              <div className="flex items-center gap-3 px-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">Already a member?</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="flex items-center justify-center gap-5 mt-3">
                <Link
                  href="/login/rescue"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login as Rescue
                </Link>
                <span className="text-gray-300">·</span>
                <Link
                  href="/login/foster"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login as Foster
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
