"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { fetchInvitationsForEmail, acceptInvitation, declineInvitation } from "@/lib/supabase/queries"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, X, Compass } from "lucide-react"

export default function UnassignedFosterDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [invitations, setInvitations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      console.log("[v0] Foster dashboard - checking user:", authUser?.email)

      if (!authUser) {
        console.log("[v0] No user, redirecting to login")
        router.push("/login/foster")
        return
      }

      setUser(authUser)

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()

      console.log("[v0] Foster profile data:", profileData)

      setProfile(profileData)

      if (profileData?.organization_id) {
        console.log("[v0] User has org, redirecting to org dashboard")
        router.push(`/org/${profileData.organization_id}/foster/dashboard`)
      } else {
        console.log("[v0] User has no org, fetching invitations")
        const inviteData = await fetchInvitationsForEmail(authUser.email!)
        console.log("[v0] Invitations found:", inviteData)
        setInvitations(inviteData)
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const handleAcceptInvitation = async (invitation: any) => {
    if (isProcessing || !profile) return
    setIsProcessing(true)

    try {
      console.log("[v0] Accepting invitation:", invitation.id)
      await acceptInvitation(invitation.id, profile.id, invitation.organization_id)
      console.log("[v0] Invitation accepted, redirecting to org dashboard")
      alert(`You've joined ${invitation.organization?.name || "the organization"}! Redirecting to your dashboard...`)
      router.push(`/org/${invitation.organization_id}/foster/dashboard`)
    } catch (error) {
      console.error("[v0] Error accepting invitation:", error)
      alert("Failed to accept invitation. Please try again.")
      setIsProcessing(false)
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    if (isProcessing) return
    setIsProcessing(true)

    try {
      console.log("[v0] Declining invitation:", invitationId)
      await declineInvitation(invitationId)
      setInvitations(invitations.filter((inv) => inv.id !== invitationId))
      setIsProcessing(false)
    } catch (error) {
      console.error("[v0] Error declining invitation:", error)
      alert("Failed to decline invitation. Please try again.")
      setIsProcessing(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login/foster")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-bark font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-cream">
      <header className="bg-white/80 backdrop-blur-sm border-b border-[color:var(--color-border-soft)] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-orange/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-primary-bark" style={{ fontFamily: "Lora, serif" }}>
              Second Tail
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-primary-bark hover:text-primary-orange transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        {invitations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-[color:var(--color-border-soft)] overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-primary-orange/10 to-secondary-rust/10 p-6 border-b border-[color:var(--color-border-soft)]">
              <h2 className="text-2xl font-bold text-primary-bark mb-2" style={{ fontFamily: "Lora, serif" }}>
                Pending Invitations
              </h2>
              <p className="text-sm text-text-muted">You've been invited to join rescue organizations!</p>
            </div>

            <div className="p-6 space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between gap-4 p-4 bg-neutral-cream rounded-xl border border-[color:var(--color-border-soft)]"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary-bark mb-1">
                      {invitation.organization?.name || "Organization"}
                    </h3>
                    <p className="text-sm text-text-muted">{invitation.organization?.email || invitation.email}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvitation(invitation)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-orange text-white text-sm font-semibold hover:bg-primary-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineInvitation(invitation.id)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-primary-bark text-primary-bark text-sm font-semibold hover:bg-neutral-cream disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <X className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-[color:var(--color-border-soft)] overflow-hidden mb-8">
          <div className="relative h-48 sm:h-64 bg-gradient-to-r from-primary-orange/20 via-neutral-clay/30 to-primary-orange/20 flex items-center justify-center">
            <div className="text-center space-y-3 px-4">
              <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-primary-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-primary-bark" style={{ fontFamily: "Lora, serif" }}>
                Welcome, {user?.user_metadata?.name || profile?.name || "Friend"}!
              </h1>
              <p className="text-lg text-text-muted">You're one step closer to making a difference</p>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-6">
            {/* Profile Completeness Banner */}
            {(!profile?.city || !profile?.state || !profile?.phone || !profile?.experience_level) && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <p className="text-base font-semibold text-yellow-800">Complete your profile</p>
                </div>
                <p className="text-sm text-yellow-700 leading-relaxed">
                  Finish setting up your foster profile so rescues can match you with the right dogs.
                </p>
                <Link
                  href="/foster/onboarding"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600 transition"
                >
                  Complete Profile
                </Link>
              </div>
            )}

            {/* Explore Organizations CTA */}
            <div className="bg-gradient-to-r from-primary-orange/10 to-secondary-rust/10 rounded-2xl p-6 space-y-3">
              <h3 className="text-lg font-semibold text-primary-bark">Looking for more fostering opportunities?</h3>
              <p className="text-sm text-text-muted">
                Discover rescue organizations near you and request to join as a foster.
              </p>
              <Link
                href="/foster/explore"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-orange text-white text-sm font-semibold hover:bg-primary-orange/90 transition"
              >
                <Compass className="w-4 h-4" />
                Explore Rescues
              </Link>
            </div>

            <div className="bg-neutral-clay/40 border-2 border-primary-orange/20 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary-orange animate-pulse"></div>
                <p className="text-base font-semibold text-primary-bark">Setting up your account</p>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                Your foster account is ready! You just need to connect with a rescue organization to start your
                fostering journey.
              </p>
            </div>

            <div className="space-y-5 pt-4">
              <h2 className="text-2xl font-bold text-primary-bark" style={{ fontFamily: "Lora, serif" }}>
                How to get started
              </h2>

              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-white border border-[color:var(--color-border-soft)] rounded-xl hover:shadow-md transition">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-orange to-primary-orange/70 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary-bark mb-1.5">Find a rescue organization</h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      Search for local rescue organizations in your area that you'd like to foster with. Look for
                      organizations that align with your values and lifestyle.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-white border border-[color:var(--color-border-soft)] rounded-xl hover:shadow-md transition">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-orange to-primary-orange/70 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary-bark mb-1.5">Share your email</h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-2">
                      Contact the rescue and share your registered email address with them:
                    </p>
                    <div className="inline-flex items-center gap-2 bg-neutral-clay/40 border border-[color:var(--color-border-soft)] px-4 py-2 rounded-lg">
                      <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-mono text-sm text-primary-bark">{user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-white border border-[color:var(--color-border-soft)] rounded-xl hover:shadow-md transition">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-orange to-primary-orange/70 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary-bark mb-1.5">Wait for approval</h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      The rescue admin will add you to their team. Once approved, you'll get full access to your foster
                      dashboard and can start caring for dogs in need!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary-orange px-6 py-3.5 text-base font-semibold text-white hover:bg-primary-orange/90 hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Check Status
              </button>
              <Link
                href="/login/foster"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white border-2 border-primary-bark px-6 py-3.5 text-base font-semibold text-primary-bark hover:bg-neutral-cream transition-all"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[color:var(--color-border-soft)] p-6 text-center space-y-3">
          <h3 className="text-lg font-semibold text-primary-bark">Need help?</h3>
          <p className="text-sm text-text-muted">
            If you have questions about the fostering process or need assistance,{" "}
            <a href="mailto:support@secondtail.org" className="text-primary-orange hover:underline font-semibold">
              contact our support team
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
