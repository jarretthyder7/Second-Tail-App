"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, ChevronLeft, ExternalLink, Clock } from "lucide-react"

export default function FosterOrganizationsPage() {
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/login/foster")
        return
      }

      setUser(authUser)

      // Fetch profile to get organization
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, organizations(*)")
        .eq("id", authUser.id)
        .single()

      if (profileData?.organization_id && profileData.organizations) {
        setOrganizations([profileData.organizations])
      }

      // Fetch pending invitations
      const { data: invites } = await supabase
        .from("invitations")
        .select("*, organizations(*)")
        .eq("email", authUser.email)
        .eq("status", "pending")

      setPendingRequests(invites || [])
      setIsLoading(false)
    }

    fetchData()

    const handleOrgUpdate = () => {
      fetchData()
    }

    window.addEventListener("organization-updated", handleOrgUpdate)

    return () => {
      window.removeEventListener("organization-updated", handleOrgUpdate)
    }
  }, [router])

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
          <p className="text-primary-bark font-medium">Loading organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-cream">
      <header className="bg-white/80 backdrop-blur-sm border-b border-[color:var(--color-border-soft)] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/foster/dashboard" className="p-2 hover:bg-neutral-cream rounded-lg transition">
              <ChevronLeft className="w-5 h-5 text-primary-bark" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-primary-bark" style={{ fontFamily: "Lora, serif" }}>
                Your Rescue Organizations
              </h1>
              <p className="text-sm text-text-muted">Manage your connections</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-primary-bark hover:text-primary-orange transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Active Organizations */}
        <div>
          <h2 className="text-2xl font-bold text-primary-bark mb-4" style={{ fontFamily: "Lora, serif" }}>
            Active Organizations
          </h2>

          {organizations.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-[color:var(--color-border-soft)] p-12 text-center">
              <Building2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary-bark mb-2">No organizations yet</h3>
              <p className="text-text-muted mb-6">You haven't joined any rescue organizations yet.</p>
              <Link
                href="/foster/explore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-orange text-white font-semibold hover:bg-primary-orange/90 transition"
              >
                Explore Organizations
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="bg-white rounded-2xl shadow-sm border border-[color:var(--color-border-soft)] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primary-bark mb-2">{org.name}</h3>
                      <div className="space-y-1 text-sm text-text-muted">
                        <p>
                          {org.city}, {org.state}
                        </p>
                        <p>{org.email}</p>
                      </div>
                      <div className="mt-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          Active Foster
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/org/${org.id}/foster/dashboard`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-orange text-white font-medium hover:bg-primary-orange/90 transition"
                    >
                      View Dashboard
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-primary-bark mb-4" style={{ fontFamily: "Lora, serif" }}>
              Pending Requests
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl shadow-sm border border-[color:var(--color-border-soft)] p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary-bark mb-1">
                        {request.organizations?.name || "Organization"}
                      </h3>
                      <p className="text-sm text-text-muted mb-3">
                        Invited {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-text-muted border border-[color:var(--color-border-soft)] rounded-lg hover:bg-neutral-cream transition">
                      Cancel Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
