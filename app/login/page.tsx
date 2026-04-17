"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const Heart = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7Z" />
  </svg>
)

const Users = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export default function LoginPage() {
  const [activeView, setActiveView] = useState<"foster" | "rescue">("rescue")

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{
        // Modern multi-layer background with CSS variables
        background: `
          radial-gradient(
            circle at 50% 30%,
            rgba(215, 107, 26, 0.08) 0%,
            transparent 50%
          ),
          radial-gradient(
            circle at 15% 80%,
            rgba(90, 74, 66, 0.05) 0%,
            transparent 45%
          ),
          radial-gradient(
            circle at 85% 85%,
            rgba(247, 226, 189, 0.06) 0%,
            transparent 50%
          ),
          linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.5),
            rgba(247, 226, 189, 0.3)
          ),
          var(--brand-bg, #F8F5F0)
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Subtle noise overlay pseudo-element using CSS gradients */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.1) 2px,
              rgba(0, 0, 0, 0.1) 4px
            )
          `,
        }}
      />

      {/* Soft blob shapes - absolutely positioned with CSS */}
      <div className="absolute top-20 left-12 w-72 h-72 opacity-[0.08] pointer-events-none hidden md:block" 
        style={{
          background: 'radial-gradient(circle, rgba(215, 107, 26, 0.3) 0%, transparent 70%)',
          borderRadius: '45% 55% 52% 48% / 48% 45% 55% 52%',
          filter: 'blur(40px)',
        }}
      />

      <div className="absolute bottom-32 right-20 w-80 h-80 opacity-[0.07] pointer-events-none hidden lg:block" 
        style={{
          background: 'radial-gradient(circle, rgba(90, 74, 66, 0.25) 0%, transparent 70%)',
          borderRadius: '52% 48% 45% 55% / 55% 52% 48% 45%',
          filter: 'blur(50px)',
        }}
      />

      <div className="absolute top-1/3 right-1/4 w-64 h-64 opacity-[0.06] pointer-events-none hidden md:block" 
        style={{
          background: 'radial-gradient(circle, rgba(247, 226, 189, 0.4) 0%, transparent 70%)',
          borderRadius: '48% 52% 55% 45% / 45% 48% 52% 55%',
          filter: 'blur(45px)',
        }}
      />
      <Link
        href="/"
        className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-orange transition-colors z-20 p-2 sm:p-0"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-white rounded-full shadow-md border border-gray-200">
          <button
            onClick={() => setActiveView("rescue")}
            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              activeView === "rescue" ? "text-white shadow-sm" : "bg-transparent text-gray-700 hover:text-gray-900"
            }`}
            style={activeView === "rescue" ? { backgroundColor: "#5a4a42" } : {}}
          >
            Rescue
          </button>
          <button
            onClick={() => setActiveView("foster")}
            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              activeView === "foster" ? "text-white shadow-sm" : "bg-transparent text-gray-700 hover:text-gray-900"
            }`}
            style={activeView === "foster" ? { backgroundColor: "#d77a45" } : {}}
          >
            Fosters
          </button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-12 left-8 opacity-[0.07] pointer-events-none hidden md:block">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M60 95C47.5 95 35 87.5 30 77.5C25 67.5 25 57.5 30 47.5C35 37.5 40 32.5 45 30C50 27.5 55 25 60 25C65 25 70 27.5 75 30C80 32.5 85 37.5 90 47.5C95 57.5 95 67.5 90 77.5C85 87.5 72.5 95 60 95Z"
            fill="#D76B1A"
          />
          <circle cx="50" cy="55" r="4" fill="#50402B" />
          <circle cx="70" cy="55" r="4" fill="#50402B" />
          <path
            d="M55 65C55 65 57.5 70 60 70C62.5 70 65 65 65 65"
            stroke="#50402B"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <ellipse cx="35" cy="35" rx="12" ry="18" fill="#D76B1A" />
          <ellipse cx="85" cy="35" rx="12" ry="18" fill="#D76B1A" />
        </svg>
      </div>

      <div className="absolute bottom-16 right-12 opacity-[0.06] pointer-events-none hidden md:block">
        <div className="flex flex-col gap-8">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="30" cy="35" rx="12" ry="15" fill="#D76B1A" />
            <circle cx="18" cy="20" r="7" fill="#D76B1A" />
            <circle cx="30" cy="15" r="7" fill="#D76B1A" />
            <circle cx="42" cy="20" r="7" fill="#D76B1A" />
            <circle cx="24" cy="10" r="6" fill="#D76B1A" />
          </svg>
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="ml-12"
          >
            <ellipse cx="30" cy="35" rx="12" ry="15" fill="#D76B1A" />
            <circle cx="18" cy="20" r="7" fill="#D76B1A" />
            <circle cx="30" cy="15" r="7" fill="#D76B1A" />
            <circle cx="42" cy="20" r="7" fill="#D76B1A" />
            <circle cx="24" cy="10" r="6" fill="#D76B1A" />
          </svg>
        </div>
      </div>

      <div className="absolute top-20 right-16 opacity-[0.08] pointer-events-none hidden lg:block">
        <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 50C20 45 25 40 30 40C35 40 40 35 45 35C50 35 55 35 60 40C65 45 70 45 75 50C80 55 80 60 75 65C70 70 60 75 50 75C40 75 30 70 25 65C20 60 20 55 20 50Z"
            fill="#F7E2BD"
          />
          <circle cx="35" cy="45" r="3" fill="#50402B" />
          <circle cx="55" cy="45" r="3" fill="#50402B" />
          <ellipse cx="15" cy="35" rx="8" ry="12" fill="#F7E2BD" />
          <ellipse cx="75" cy="35" rx="8" ry="12" fill="#F7E2BD" />
          <path d="M85 60C85 60 85 70 80 70C75 70 70 65 70 65" stroke="#F7E2BD" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      <div className="absolute bottom-24 left-16 opacity-[0.05] pointer-events-none hidden lg:block">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="40" cy="50" rx="16" ry="20" fill="#50402B" />
          <circle cx="24" cy="28" r="10" fill="#50402B" />
          <circle cx="40" cy="22" r="10" fill="#50402B" />
          <circle cx="56" cy="28" r="10" fill="#50402B" />
          <circle cx="32" cy="16" r="8" fill="#50402B" />
        </svg>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full border-2 border-primary-orange" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full border-2 border-primary-bark" />
      </div>

      <div className="max-w-lg w-full bg-white rounded-2xl sm:rounded-3xl shadow-md border border-gray-200 p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 relative z-10 mx-4">
        <div className="text-center space-y-2 sm:space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "Lora, serif", color: "#5a4a42" }}>
            Second Tail
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {activeView === "foster" ? "Foster Parent Login" : "Rescue Organization Login"}
          </p>
        </div>

        {activeView === "foster" ? (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-primary-orange" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Foster Login</h2>
              <p className="text-sm text-gray-600">
                Log in to your foster account to manage your animals and communicate with your rescue organization.
              </p>
            </div>

            <Link
              href="/login/foster"
              style={{ backgroundColor: "#d77a45" }}
              className="w-full flex items-center justify-center gap-3 rounded-xl sm:rounded-full px-6 h-12 sm:h-14 text-sm sm:text-base font-semibold text-white hover:opacity-90 transition-all hover:shadow-lg"
            >
              <Heart className="w-5 h-5" />
              Foster Login
            </Link>

            <div className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
              <p className="mt-4">Need access? Contact your rescue organization for an invitation.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-bark/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-bark" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Rescue Team Login</h2>
              <p className="text-sm text-gray-600">
                Log in to your rescue account to manage your organization and communicate with foster parents.
              </p>
            </div>

            <Link
              href="/login/rescue"
              style={{ backgroundColor: "#5a4a42" }}
              className="w-full flex items-center justify-center gap-3 rounded-xl sm:rounded-full px-6 h-12 sm:h-14 text-sm sm:text-base font-semibold text-white hover:opacity-90 transition-all hover:shadow-lg"
            >
              <Users className="w-5 h-5" />
              Rescue Team Login
            </Link>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-center text-gray-600 mb-4">New to Second Tail?</p>
              <div className="flex items-center justify-center">
                <Link
                  href="/sign-up/rescue"
                  style={{ color: "#5a4a42" }}
                  className="text-sm font-semibold hover:underline transition"
                >
                  Register Your Rescue Organization
                </Link>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs sm:text-sm text-center text-gray-500 pt-1 sm:pt-2">Secure login powered by Second Tail</p>
      </div>
    </div>
  )
}
