"use client"

import type React from "react"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

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

function SuccessContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "foster"
  const orgName = searchParams.get("org")

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF8F4] px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 space-y-6 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#D76B1A]/10 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 md:w-10 md:h-10 text-[#D76B1A]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora, serif" }}>
            Check Your Email
          </h1>
          <p className="text-sm md:text-base text-[#2E2E2E]/70 leading-relaxed">
            We've sent you a confirmation link to verify your email address. Please check your inbox and click the link
            to complete your registration.
          </p>
          {orgName && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
              <p className="text-sm text-green-800 font-semibold">You've been automatically connected to {orgName}!</p>
              <p className="text-xs text-green-700 mt-1">
                After confirming your email, you'll have full access to your foster dashboard.
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#FBF8F4] rounded-xl p-4 space-y-2">
          <p className="text-xs text-[#2E2E2E]/60">Didn't receive the email? Check your spam folder or</p>
          <Link href={`/sign-up/${type}`} className="text-sm font-semibold text-[#D76B1A] hover:underline">
            Try signing up again
          </Link>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-full bg-[#D76B1A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition-all hover:shadow-md"
        >
          Return to Login
        </Link>
      </div>
    </div>
  )
}

export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
