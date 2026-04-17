"use client"

import { useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  const [activeView, setActiveView] = useState<"foster" | "rescue">("rescue")

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <section className="pt-10 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 lg:pb-16" style={{ backgroundColor: "#FDF6EC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 text-center">
            {/* Dog logo - full color, centered */}
            <div className="flex justify-center mb-2 sm:mb-3">
              <img
                src="/logo-dog.png"
                alt="Second Tail"
                className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Fostering and rescue, made easier for everyone involved.
            </h1>
            
            <p className="text-base sm:text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
              Rescue coordination without the chaos. Invite fosters, assign animals, track appointments, handle supply requests — everything from one dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6">
              <Link
                href="/sign-up/rescue"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-colors shadow-lg"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Register Your Rescue
              </Link>
              <Link
                href="/sign-up/foster"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 rounded-full font-semibold text-sm sm:text-base transition-colors"
                style={{ borderColor: "#D76B1A", color: "#D76B1A" }}
              >
                Sign Up to Foster
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Curved divider */}
      <div className="relative h-16 sm:h-24" style={{ backgroundColor: "#FDF6EC" }}>
        <svg className="absolute bottom-0 w-full h-16 sm:h-24" viewBox="0 0 1440 96" fill="none" preserveAspectRatio="none">
          <path d="M0 96L1440 96L1440 0C1440 0 1080 96 720 96C360 96 0 0 0 0L0 96Z" fill="white" />
        </svg>
      </div>

      <section className="w-full py-8 sm:py-12 lg:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
              <div className="text-center px-4">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                  style={{ backgroundColor: "#D76B1A" }}
                >
                  1
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Sign up and get started</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Create your foster account directly. No invite required—join and connect with rescues
                </p>
              </div>
              <div className="text-center px-4">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                  style={{ backgroundColor: "#D76B1A" }}
                >
                  2
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Connect with rescues and receive placements</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Browse rescues, express interest, and receive animals to foster
                </p>
              </div>
              <div className="text-center px-4">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6"
                  style={{ backgroundColor: "#D76B1A" }}
                >
                  3
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Track care, share updates, request supplies</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Manage everything in one place and communicate seamlessly with your rescue partner
                </p>
              </div>
            </div>
            <div className="text-center mt-10 sm:mt-14">
              <Link
                href="/sign-up/foster"
                className="inline-block px-8 py-3.5 rounded-full font-semibold text-base hover:opacity-90 transition-colors text-white"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Sign Up to Foster
              </Link>
            </div>
          </>
        ) : (
          <>
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
            <div className="text-center mt-10 sm:mt-14">
              <Link
                href="/for-rescue-organizations"
                className="inline-block px-8 py-3.5 rounded-full font-semibold text-base hover:opacity-90 transition-colors text-white"
                style={{ backgroundColor: "#5a4a42" }}
              >
                Learn More
              </Link>
            </div>
          </>
        )}
        </div>
      </section>

      {/* Demo Section - Built for both sides */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Built for both sides of fostering
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              A mobile-first foster experience and a powerful desktop dashboard for rescue teams.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Foster Mobile Preview */}
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-[240px] sm:max-w-[260px] aspect-[9/19] rounded-[2rem] border-[8px] border-gray-900 bg-gray-900 shadow-xl overflow-hidden">
                <img
                  src="/demo/foster-mobile.png"
                  alt="Foster dashboard on mobile"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-900 mt-4">For Fosters</p>
              <p className="text-xs sm:text-sm text-gray-600">On the go, on your phone</p>
            </div>

            {/* Rescue Desktop Preview */}
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-[16/10] rounded-lg border-[6px] border-gray-900 bg-gray-900 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-4 bg-gray-800 flex items-center gap-1 px-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                </div>
                <img
                  src="/demo/rescue-desktop.png"
                  alt="Rescue admin dashboard on desktop"
                  className="w-full h-full object-cover object-top pt-4"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-900 mt-4">For Rescues</p>
              <p className="text-xs sm:text-sm text-gray-600">Full admin control on desktop</p>
            </div>
          </div>
        </div>
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
                href="/sign-up/foster"
            className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-full font-semibold text-base sm:text-lg hover:opacity-90 transition-colors shadow-lg"
              style={{ backgroundColor: "#D76B1A" }}
            >
              Sign Up to Foster
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
                href="/for-rescue-organizations"
            className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-full font-semibold text-base sm:text-lg transition-colors shadow-lg"
              style={{ backgroundColor: "#5a4a42" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Learn More for Rescues
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
            Making fostering easier, one dog at a time.
          </p>
          <Link
            href="/for-fosters"
            className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-orange-600 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-100 transition-colors"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Two-Column CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Card - Orange */}
            <div style={{ backgroundColor: "#D76B1A" }} className="rounded-2xl p-8 sm:p-12 text-white flex flex-col justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                  For Rescue Organizations
                </h2>
                <p className="text-lg sm:text-xl text-white/90 mb-8">
                  Manage your foster network without the chaos.
                </p>
              </div>
              <Link
                href="/sign-up/rescue"
                className="inline-block w-full sm:w-auto px-8 py-4 bg-white text-orange-600 rounded-full font-semibold text-base hover:bg-gray-100 transition-colors text-center"
              >
                Register Your Rescue
              </Link>
            </div>

            {/* Right Card - Cream with Border */}
            <div style={{ backgroundColor: "#FDF6EC", borderColor: "#D76B1A" }} className="rounded-2xl p-8 sm:p-12 border-2 text-gray-900 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                  For Foster Parents
                </h2>
                <p className="text-lg sm:text-xl text-gray-700 mb-8">
                  Sign up free and connect with rescues in your area.
                </p>
              </div>
              <Link
                href="/sign-up/foster"
                className="inline-block w-full sm:w-auto px-8 py-4 text-white rounded-full font-semibold text-base hover:opacity-90 transition-colors text-center"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Sign Up for Fosters
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
