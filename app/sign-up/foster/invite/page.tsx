"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Eye, EyeOff } from "lucide-react"

export default function FosterInviteSignupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get("code")

  const [orgName, setOrgName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate invitation on mount
  useState(() => {
    const validateInvitation = async () => {
      if (!code) {
        setError("This invitation link is invalid or has already been used.")
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: invitation, error: invitationError } = await supabase
          .from("foster_invitations")
          .select("*, organizations(name)")
          .eq("code", code)
          .eq("status", "pending")
          .maybeSingle()

        if (invitationError || !invitation) {
          setError("This invitation link is invalid or has already been used.")
          setIsLoading(false)
          return
        }

        // Set the org name and pre-fill email
        if (invitation.organizations) {
          setOrgName(invitation.organizations.name)
        }
        setEmail(invitation.email)
        setIsLoading(false)
      } catch (err) {
        console.error("Error validating invitation:", err)
        setError("This invitation link is invalid or has already been used.")
        setIsLoading(false)
      }
    }

    validateInvitation()
  }, [code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password || isSubmitting) return

    try {
      setIsSubmitting(true)
      setError("")

      const supabase = createClient()

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: fullName,
            full_name: fullName,
            role: "foster",
            invite_code: code,
          },
        },
      })

      if (signUpError) throw signUpError

      // Show success message
      router.push(`/auth/sign-up-success?type=foster&email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      console.error("Signup error:", err)
      setError(err.message || "Failed to create account. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="animate-pulse text-center">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF8F4] flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {error ? (
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-gray-900">Invalid Invitation</h1>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Join as a Foster</h1>
                <p className="text-gray-600">
                  You&apos;ve been invited by <span className="font-semibold">{orgName}</span> to join Second Tail as a foster.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d97706] focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d97706] focus:border-transparent outline-none pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!fullName || !password || isSubmitting}
                  className="w-full py-3 rounded-full font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#d97706" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b86200")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#d97706")}
                >
                  {isSubmitting ? "Creating Account..." : "Create Foster Account"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
