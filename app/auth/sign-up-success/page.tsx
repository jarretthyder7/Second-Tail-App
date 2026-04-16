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
              {isRescue
                ? "We've sent a confirmation link to your rescue organization email. Click it to verify your account and get started."
                : "We've sent a confirmation link to your email. Click it to verify your account and get started."}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-[#FDF6EC] rounded-lg p-4 space-y-2 text-left">
            <p className="text-sm font-semibold text-foreground">Next steps:</p>
            <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
              <li>Check your inbox for an email from Second Tail</li>
              <li>Click the confirmation link in the email</li>
              <li>Come back here and sign in to your account</li>
            </ol>
          </div>

          {/* Spam Folder Note */}
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive it? Check your spam or junk folder. If you still don&apos;t see it,{" "}
            <Link href={`/sign-up/${type}`} className="text-[#D76B1A] font-semibold hover:underline">
              try signing up again
            </Link>
            .
          </p>

          {/* Action Button */}
          <Link
            href={`/login/${type}`}
            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-full font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#D76B1A" }}
          >
            Go to Login
          </Link>
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
