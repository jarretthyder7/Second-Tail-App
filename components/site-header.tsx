"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Users, Menu, X, ChevronDown } from "lucide-react"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false)
  const [signupDropdownOpen, setSignupDropdownOpen] = useState(false)
  const [mobileSignupOpen, setMobileSignupOpen] = useState(false)
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false)

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
            <Image 
              src="/logo-dog.svg" 
              alt="Second Tail logo" 
              width={32} 
              height={32}
              priority
              className="h-8 w-8 sm:h-9 sm:w-9"
            />
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

            <div className="relative" ref={signupDropdownRef}>
              <button
                onClick={() => { setSignupDropdownOpen(!signupDropdownOpen); setLoginDropdownOpen(false) }}
                className="flex items-center gap-1.5 text-sm font-medium px-5 py-2.5 rounded-full border-2 hover:bg-orange-50 transition-colors"
                style={{ borderColor: "#D76B1A", color: "#D76B1A" }}
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

            <div className="relative" ref={loginDropdownRef}>
              <button
                onClick={() => { setLoginDropdownOpen(!loginDropdownOpen); setSignupDropdownOpen(false) }}
                className="flex items-center gap-1.5 text-sm font-medium text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-colors"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Login
                <ChevronDown className={`w-4 h-4 transition-transform ${loginDropdownOpen ? "rotate-180" : ""}`} />
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
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(90, 74, 66, 0.12)" }}>
                        <Users className="w-4 h-4" style={{ color: "#5a4a42" }} />
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
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(90, 74, 66, 0.12)" }}>
                        <Users className="w-4 h-4" style={{ color: "#5a4a42" }} />
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
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(90, 74, 66, 0.1)" }}>
                    <Users className="w-3.5 h-3.5" style={{ color: "#5a4a42" }} />
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
  )
}
