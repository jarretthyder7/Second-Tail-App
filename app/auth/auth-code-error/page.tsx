"use client"

import type React from "react"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

const AlertCircle = (props: React.SVGProps<SVGSVGElement>) => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "Unknown error"
  const errorDescription = searchParams.get("error_description") || "An error occurred during authentication"

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-cream px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-bark" style={{ fontFamily: "Lora, serif" }}>
              Authentication Error
            </h1>
            <p className="text-sm text-text-secondary">{errorDescription}</p>
            {error !== "Unknown error" && <p className="text-xs text-text-tertiary">Error code: {error}</p>}
          </div>

          <div className="flex flex-col gap-3 w-full pt-4">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center rounded-full bg-primary-orange px-6 py-3 text-sm font-semibold text-white hover:bg-primary-orange/90 transition-all"
            >
              Try Again
            </Link>
            <Link href="/" className="text-sm text-text-secondary hover:text-bark transition">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
