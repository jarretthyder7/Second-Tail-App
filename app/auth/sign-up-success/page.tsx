"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Mail } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

function SuccessContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "foster"
  const email = searchParams.get("email") || ""
  const isRescue = type === "rescue"

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 space-y-6 text-center">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#D76B1A]/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#D76B1A]" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Check Your Email</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;ve sent a confirmation link to <span className="font-semibold">{email || "your email"}</span>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-[#FDF6EC] rounded-lg p-4 space-y-2 text-left">
            <p className="text-sm font-semibold text-foreground">What happens next:</p>
            <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
              <li>Check your inbox for an email from Second Tail</li>
              <li>Click the <strong>confirmation link</strong> in the email</li>
              <li>You&apos;ll be taken directly to your onboarding</li>
            </ol>
          </div>

          {/* Disabled Get Started button — only unlocks after email confirmation */}
          <div className="space-y-2">
            <button
              disabled
              className="inline-flex items-center justify-center w-full px-6 py-3 rounded-full font-semibold text-white opacity-40 cursor-not-allowed"
              style={{ backgroundColor: "#D76B1A" }}
            >
              Get Started
            </button>
            <p className="text-xs text-muted-foreground">
              This button unlocks automatically after you confirm your email. You&apos;ll be redirected to onboarding when you click the link.
            </p>
          </div>

          {/* Spam Folder Note */}
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive it? Check your spam or junk folder. If you still don&apos;t see it,{" "}
            <Link href={`/sign-up/${type}`} className="text-[#D76B1A] font-semibold hover:underline">
              try signing up again
            </Link>
            .
          </p>
        </div>
      </div>

      <SiteFooter />
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
