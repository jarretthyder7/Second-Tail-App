"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Heart, Users, ArrowRight, Menu, X, CheckCircle2, ChevronDown, Briefcase, Calendar, Package, DollarSign, MessageCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

export default function Home() {
  const [activeView, setActiveView] = useState<"foster" | "rescue">("rescue")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false)
  const loginDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if we should start on foster view based on URL hash or button click
    const handleHashChange = () => {
      if (window.location.hash === "#foster-waitlist") {
        setActiveView("foster")
      }
    }
    
    // Check on initial load
    handleHashChange()
    
    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(e.target as Node)) {
        setLoginDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  const [fosterName, setFosterName] = useState("")
  const [fosterEmail, setFosterEmail] = useState("")
  const [fosterCity, setFosterCity] = useState("")
  const [fosterState, setFosterState] = useState("")
  const [fosterAgree, setFosterAgree] = useState(false)
  const [fosterSubmitted, setFosterSubmitted] = useState(false)
  const [fosterLoading, setFosterLoading] = useState(false)
  const [fosterError, setFosterError] = useState<string | null>(null)

  const [rescueName, setRescueName] = useState("")
  const [rescueOrgName, setRescueOrgName] = useState("")
  const [rescueEmail, setRescueEmail] = useState("")
  const [rescueCity, setRescueCity] = useState("")
  const [rescueState, setRescueState] = useState("")
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
        city: fosterCity,
        state: fosterState,
        type: "foster",
      })
      if (error) throw error
      // Send waitlist confirmation email (fire and forget)
      fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "foster-waitlist", email: fosterEmail, name: fosterName }),
      }).catch(() => {})
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
        city: rescueCity,
        state: rescueState,
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
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50" style={{ borderBottomColor: "rgba(90, 74, 66, 0.1)" }}>
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
              <div className="relative" ref={loginDropdownRef}>
                <button
                  onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
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
              <div className="pt-1 space-y-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Login as</p>
                <Link
                  href="/login/rescue"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-amber-50 rounded-full transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(90, 74, 66, 0.12)" }}>
                    <Users className="w-3.5 h-3.5" style={{ color: "#5a4a42" }} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Rescue Org</div>
                    <div className="text-xs text-gray-500 font-normal">Login to your dashboard</div>
                  </div>
                </Link>
                <Link
                  href="/login/foster"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 rounded-full transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                    <Heart className="w-3.5 h-3.5" style={{ color: "#D76B1A" }} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Foster Parent</div>
                    <div className="text-xs text-gray-500 font-normal">Login to your dashboard</div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <section className="py-16 sm:py-20 lg:py-28" style={{ backgroundColor: "#FDF6EC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Fostering and rescue, made easier for everyone involved.
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
              Rescue coordination without the chaos. Invite fosters, assign animals, track appointments, handle supply requests — everything from one dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6">
              <Link
                href="/sign-up/rescue"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-colors shadow-lg"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Register Your Rescue
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Link>
              <button
                onClick={() => {
                  document.getElementById("foster-waitlist")?.scrollIntoView({ behavior: "smooth" })
                  setActiveView("foster")
                }}
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 rounded-full font-semibold text-sm sm:text-base transition-colors"
                style={{ borderColor: "#D76B1A", color: "#D76B1A" }}
              >
                Join Foster Waitlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
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
            {/* Feature 1: Foster Management */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Foster Management</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Invite fosters by email. Assign them animals. Track who's caring for what dog.
              </p>
            </div>

            {/* Feature 2: Appointment Scheduling */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(90, 74, 66, 0.12)" }}>
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#5a4a42" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Appointment Scheduling</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Vet visits, check-ins, drop-offs. One calendar, no more group texts.
              </p>
            </div>

            {/* Feature 3: Supply Requests */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                <Package className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Supply Requests</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Fosters request supplies. You approve. Done.
              </p>
            </div>

            {/* Feature 4: Reimbursements */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(90, 74, 66, 0.12)" }}>
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#5a4a42" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Reimbursements</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Foster paid out of pocket? Handle it without the paperwork.
              </p>
            </div>

            {/* Feature 5: Team Messaging */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Team Messaging</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Message individual fosters or your whole team. No more group chat chaos.
              </p>
            </div>

            {/* Feature 6: Emergency Support */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(90, 74, 66, 0.12)" }}>
                <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#5a4a42" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Emergency Support</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Fosters get emergency contacts and resources 24/7 when they need help fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Rescue Card - Hidden */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 hover:shadow-2xl transition-all border-2 border-amber-200 flex flex-col">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
              style={{ backgroundColor: "rgba(90, 74, 66, 0.15)" }}
            >
              <Users className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#5a4a42" }} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">For Rescue Organizations</h3>
            <p className="text-gray-700 text-base sm:text-lg mb-5 sm:mb-6 leading-relaxed flex-1">
              Streamline foster coordination. Simple tools to manage relationships, track care, and scale without
              burnout.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/for-rescue-organizations"
                className="inline-flex items-center justify-center px-6 py-3.5 sm:py-3 text-white rounded-full font-semibold hover:opacity-90 transition-colors text-base"
                style={{ backgroundColor: "#5a4a42" }}
              >
                Learn More
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <button
                onClick={() => {
                  setActiveView("rescue")
                  document.getElementById("foster-waitlist")?.scrollIntoView({ behavior: "smooth" })
                }}
                className="inline-flex items-center justify-center px-6 py-3.5 sm:py-3 border-2 rounded-full font-semibold hover:bg-amber-50 transition-colors text-base"
                style={{ borderColor: "#5a4a42", color: "#5a4a42" }}
              >
                Join Waitlist
              </button>
            </div>
          </div>

          {/* Foster Card - Hidden */}
          <div
            className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 hover:shadow-2xl transition-all border-2 flex flex-col"
            style={{ borderColor: "rgba(215, 107, 26, 0.2)" }}
          >
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
              style={{ backgroundColor: "rgba(215, 107, 26, 0.15)" }}
            >
              <Heart className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">For Foster Parents</h3>
            <p className="text-gray-700 text-base sm:text-lg mb-5 sm:mb-6 leading-relaxed flex-1">
              A simple dashboard to collaborate with your rescue organization. Track care, communicate easily, and get
              the support you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/for-fosters"
                className="inline-flex items-center justify-center px-6 py-3.5 sm:py-3 text-white rounded-full font-semibold hover:opacity-90 transition-colors text-base"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Learn More
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <button
                onClick={() => {
                  setActiveView("foster")
                  document.getElementById("foster-waitlist")?.scrollIntoView({ behavior: "smooth" })
                }}
                className="inline-flex items-center justify-center px-6 py-3.5 sm:py-3 border-2 rounded-full font-semibold hover:bg-orange-50 transition-colors text-base"
                style={{ borderColor: "#D76B1A", color: "#D76B1A" }}
              >
                Join Waitlist
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm sm:text-base text-gray-500 pt-6 sm:pt-8">
          Already a member?{" "}
          <Link
            href={activeView === "foster" ? "/login/foster" : "/login/rescue"}
            className="text-gray-900 font-medium hover:underline"
          >
            Log in
          </Link>
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 bg-[#FDF6EC] rounded-2xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-6 sm:mb-8 px-2">
          How Second Tail Works
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16 px-4">
          <button
            onClick={() => setActiveView("rescue")}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 rounded-full font-semibold transition-all text-base ${
              activeView === "rescue" ? "text-white shadow-lg" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            style={activeView === "rescue" ? { backgroundColor: "#5a4a42" } : {}}
          >
            For Rescue Organizations
          </button>
          <button
            onClick={() => setActiveView("foster")}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 rounded-full font-semibold transition-all text-base ${
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
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Accept your rescue's invite and log in</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Receive an invitation from your rescue organization and create your foster account
              </p>
            </div>
            <div className="text-center px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: "#D76B1A" }}
              >
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">View your assigned animal and care plan</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                See details about the dog you're fostering, medical history, and care instructions
              </p>
            </div>
            <div className="text-center px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: "#D76B1A" }}
              >
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Log updates, request supplies, message your team</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage everything in one place and stay connected with your rescue organization
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
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Create your org and invite your team members</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Register your rescue, add team members, and set up your organization
              </p>
            </div>
            <div className="text-center px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: "#5a4a42" }}
              >
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Add your animals and invite fosters by email</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Onboard your rescue animals and send invitations to foster parents
              </p>
            </div>
            <div className="text-center px-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: "#5a4a42" }}
              >
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Manage everything from your dashboard. Answer requests. Track care.</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Track placements, coordinate appointments, and communicate with your entire foster network
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
                href="/login/foster"
            className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-full font-semibold text-base sm:text-lg hover:opacity-90 transition-colors shadow-lg"
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
            className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-full font-semibold text-base sm:text-lg transition-colors shadow-lg"
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

      {/* CTA Banner Section */}
      <section style={{ backgroundColor: "#D76B1A" }} className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Built by someone who actually fosters.
          </h2>
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Currently accepting early access partners.
          </p>
          <Link
            href="/sign-up/rescue"
            className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-orange-600 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-100 transition-colors"
          >
            Request Early Access
          </Link>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="foster-waitlist" className="border-t border-gray-200 bg-gradient-to-br from-orange-50/40 to-amber-50/40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Stay Connected
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Get notified when Second Tail launches in your area.
            </p>

            {/* Tab switcher */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setActiveView("rescue")}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  activeView === "rescue" ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={activeView === "rescue" ? { backgroundColor: "#5a4a42" } : {}}
              >
                Rescue Organization
              </button>
              <button
                onClick={() => setActiveView("foster")}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  activeView === "foster" ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={activeView === "foster" ? { backgroundColor: "#D76B1A" } : {}}
              >
                Foster Parent
              </button>
            </div>
          </div>

          {/* Foster Waitlist Form */}
          {activeView === "foster" && (
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">City</label>
                      <input
                        type="text"
                        required
                        value={fosterCity}
                        onChange={(e) => setFosterCity(e.target.value)}
                        placeholder="e.g. Austin"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                        style={{ "--tw-ring-color": "rgba(215, 107, 26, 0.4)" } as React.CSSProperties}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">State</label>
                      <select
                        required
                        value={fosterState}
                        onChange={(e) => setFosterState(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white"
                        style={{ "--tw-ring-color": "rgba(215, 107, 26, 0.4)" } as React.CSSProperties}
                      >
                        <option value="">State</option>
                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
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
                    className="w-full px-6 py-3.5 rounded-full text-white font-semibold text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: "#D76B1A" }}
                  >
                    {fosterLoading ? "Saving..." : "Notify Me"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Rescue Organization Waitlist Form */}
          {activeView === "rescue" && (
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">City</label>
                      <input
                        type="text"
                        required
                        value={rescueCity}
                        onChange={(e) => setRescueCity(e.target.value)}
                        placeholder="e.g. Austin"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                        style={{ "--tw-ring-color": "rgba(90, 74, 66, 0.4)" } as React.CSSProperties}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">State</label>
                      <select
                        required
                        value={rescueState}
                        onChange={(e) => setRescueState(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white"
                        style={{ "--tw-ring-color": "rgba(90, 74, 66, 0.4)" } as React.CSSProperties}
                      >
                        <option value="">State</option>
                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
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
                    className="w-full px-6 py-3.5 rounded-full text-white font-semibold text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: "#5a4a42" }}
                  >
                    {rescueLoading ? "Saving..." : "Get Early Access"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-[#3D2B1F] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <Link href="/" className="text-xl sm:text-2xl font-bold text-white inline-block mb-4">
                Second Tail
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 md:justify-end">
              <Link href="/for-rescue-organizations" className="text-gray-300 hover:text-white transition-colors">
                For Rescues
              </Link>
              <Link href="/for-fosters" className="text-gray-300 hover:text-white transition-colors">
                For Fosters
              </Link>
              <Link href="/login/rescue" className="text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
              <button 
                onClick={() => {
                  document.getElementById("foster-waitlist")?.scrollIntoView({ behavior: "smooth" })
                  setActiveView("foster")
                }}
                className="text-gray-300 hover:text-white transition-colors text-left"
              >
                Join Waitlist
              </button>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
              <a href="mailto:hello@getsecondtail.com" className="text-gray-300 hover:text-white transition-colors">
                hello@getsecondtail.com
              </a>
              <p className="text-xs sm:text-sm text-gray-400">
                © 2026 Second Tail. Made with care for rescues and fosters.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
