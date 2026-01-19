"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, AlertCircle } from "lucide-react"

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

function FosterSignUpForm() {
  const [invitationCode, setInvitationCode] = useState("")
  const [invitation, setInvitation] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setInvitationCode(codeFromUrl)
      validateInvitation(codeFromUrl)
    }
  }, [searchParams])

  const validateInvitation = async (code: string) => {
    setIsValidating(true)
    setValidationError("")

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("invitations")
        .select("*, organization:organizations!organization_id(id, name)")
        .eq("code", code)
        .eq("status", "pending")
        .maybeSingle()

      if (error) throw error

      if (!data) {
        setValidationError("Invalid or expired invitation code. Please contact your rescue organization.")
        setInvitation(null)
      } else {
        setInvitation(data)
        setEmail(data.email || "")
      }
    } catch (err) {
      setValidationError("Failed to validate invitation code. Please try again.")
      setInvitation(null)
    } finally {
      setIsValidating(false)
    }
  }

  const handleValidateCode = () => {
    if (!invitationCode.trim()) {
      setValidationError("Please enter your invitation code")
      return
    }
    validateInvitation(invitationCode)
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!invitation) {
      setError("Valid invitation required to create foster account")
      setIsLoading(false)
      return
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            name: name,
            role: "foster",
            phone: phone,
          },
        },
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: email,
          name: name,
          role: "foster",
          organization_id: invitation.organization_id,
        })

        if (profileError) {
          console.error("[v0] Error creating profile:", profileError)
          throw new Error("Failed to create profile")
        }

        const { error: acceptError } = await supabase
          .from("invitations")
          .update({
            status: "accepted",
            updated_at: new Date().toISOString(),
          })
          .eq("id", invitation.id)

        if (acceptError) {
          console.error("[v0] Error accepting invitation:", acceptError)
        }

        try {
          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "welcome-foster",
              email: email,
              name: name,
              orgName: invitation.organization?.name,
            }),
          })
        } catch (emailError) {
          console.warn("[v0] Welcome email failed to send:", emailError)
        }
      }

      router.push(`/auth/sign-up-success?type=foster&org=${invitation.organization?.name || "rescue organization"}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-0 right-0 px-6 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <Link href="/login/foster" className="text-sm text-muted-foreground hover:text-foreground transition">
          Already have an account? <span className="font-semibold text-primary">Log in</span>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-2xl shadow-lg p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Join as Foster</h1>
              <p className="text-muted-foreground">
                Foster registration is by invitation only. Enter your invitation code from your rescue organization.
              </p>
            </div>

            {!invitation ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Invitation Code</label>
                  <input
                    type="text"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    placeholder="Enter your invitation code"
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </div>

                {validationError && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <button
                  onClick={handleValidateCode}
                  disabled={isValidating || !invitationCode.trim()}
                  className="w-full rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? "Validating..." : "Validate Code"}
                </button>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Don't have an invitation code?{" "}
                    <Link href="/for-fosters" className="text-primary hover:underline font-medium">
                      Learn more about fostering
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Invited by:</strong> {invitation.organization?.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                    required
                  />
                </div>

                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating account..." : "Create Foster Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FosterSignUpPage() {
  return (
    <Suspense fallback={null}>
      <FosterSignUpForm />
    </Suspense>
  )
}
