"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Suspense } from "react"

function AccountConfirmedContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "foster"
  const [countdown, setCountdown] = useState(5)

  const loginPath = type === "rescue" ? "/login/rescue" : "/login/foster"
  const accountType = type === "rescue" ? "rescue organization" : "foster"

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = loginPath
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loginPath])

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Account Confirmed!
              </h1>
              <p className="text-muted-foreground">
                Your {accountType} account has been verified. You can now log in to access your dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href={loginPath}
                className="block w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Go to Login
              </Link>
              <p className="text-sm text-muted-foreground">
                Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}...
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default function AccountConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AccountConfirmedContent />
    </Suspense>
  )
}
