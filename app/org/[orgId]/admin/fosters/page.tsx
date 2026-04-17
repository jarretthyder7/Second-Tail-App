"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dog, Mail, UserPlus, X, Clock, AlertCircle, UserX, User, Users, Plus, Eye, Upload } from "lucide-react"
import { createInvitation, cancelInvitation } from "@/lib/supabase/queries"
import Link from "next/link"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export default function AdminFostersPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string

  const [fostersData, setFostersData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fosters = fostersData?.fosters || []
  const pendingInvitations = fostersData?.pendingInvitations || []
  const acceptedInvitations = fostersData?.acceptedInvitations || []
  const cancelledInvitations = fostersData?.cancelledInvitations || []
  const availableDogs = fostersData?.availableDogs || []

  useEffect(() => {
    const fetchFosters = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/admin/fosters?orgId=${orgId}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setFostersData(data)
      } catch (error) {
        console.error("Error fetching fosters:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId) {
      fetchFosters()
      // Removed polling
    }
  }, [orgId])

  const mutateFosters = async () => {
    try {
      const res = await fetch(`/api/admin/fosters?orgId=${orgId}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setFostersData(data)
    } catch (error) {
      console.error("Error refreshing fosters:", error)
    }
  }

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showAssignDogModal, setShowAssignDogModal] = useState(false)
  const [selectedFoster, setSelectedFoster] = useState<any>(null)
  const [selectedDogId, setSelectedDogId] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  const handleAssignDog = async () => {
    if (!selectedFoster || !selectedDogId || isAssigning) return

    try {
      setIsAssigning(true)
      console.log("Assigning dog:", selectedDogId, "to foster:", selectedFoster.id)

      const supabase = createClient()

      const { error } = await supabase
        .from("dogs")
        .update({
          foster_id: selectedFoster.id,
          status: "fostered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedDogId)

      if (error) throw error

      console.log("Dog assigned successfully")

      const selectedDog = availableDogs.find((d) => d.id === selectedDogId)
      if (selectedDog && selectedFoster.email) {
        try {
          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "assigned-dog",
              fosterEmail: selectedFoster.email,
              fosterName: selectedFoster.name,
              dogName: selectedDog.name,
              breed: selectedDog.breed,
            }),
          })
        } catch (emailError) {
          console.warn("[v0] Failed to send assignment email:", emailError)
        }
      }

      // Create journey event for the assignment
      const { error: eventError } = await supabase.from("journey_events").insert([
        {
          dog_id: selectedDogId,
          organization_id: orgId,
          type: "assigned",
          title: `Assigned to ${selectedFoster.name}`,
          description: `${selectedFoster.name} started fostering ${selectedDog.name}`,
          timestamp: new Date().toISOString(),
          created_by_role: "admin",
        },
      ])

      if (eventError) {
        console.warn("[v0] Warning: Failed to create journey event:", eventError)
        // Don't fail the assignment if journey event fails to create
      } else {
        console.log("Journey event created for dog assignment")
      }

      await mutateFosters()

      setShowAssignDogModal(false)
      setSelectedFoster(null)
      setSelectedDogId("")
    } catch (error) {
      console.error("Error assigning dog:", error)
      alert("Failed to assign dog")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail || isInviting) return

    try {
      setIsInviting(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const invitation = await createInvitation(orgId, inviteEmail, user.id)

      // Send the invitation email with a link that directs to sign up or login
      if (invitation?.code) {
        try {
          // Check if the invited email already has a Second Tail account
          const checkRes = await fetch("/api/auth/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inviteEmail }),
          })
          const { exists: hasAccount } = await checkRes.json()

          // Build the correct destination URL based on account status
          const destination = hasAccount
            ? `${window.location.origin}/login/foster?code=${invitation.code}`
            : `${window.location.origin}/sign-up/foster/invite?code=${invitation.code}`

          // Fetch org name for the email
          const supabaseForOrg = createClient()
          const { data: org } = await supabaseForOrg
            .from("organizations")
            .select("name")
            .eq("id", orgId)
            .single()

          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "foster-invitation",
              email: inviteEmail,
              orgName: org?.name || "your rescue organization",
              signUpUrl: destination,
              hasAccount,
            }),
          })
        } catch (emailError) {
          console.warn("[v0] Invitation email failed to send:", emailError)
        }
      }

      await mutateFosters()

      // Mark invite_foster setup step as complete
      try {
        await fetch("/api/admin/setup-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgId, stepId: "invite_foster", isCompleted: true }),
        })
        window.dispatchEvent(new CustomEvent("setup-step-completed", { detail: { stepId: "invite_foster" } }))
      } catch (err) {
        console.error("Error marking invite_foster setup step:", err)
      }

      setShowInviteModal(false)
      setInviteEmail("")
    } catch (error: any) {
      console.error("Error inviting foster:", error)
      alert(error.message || "Failed to send invitation")
    } finally {
      setIsInviting(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation(invitationId)

      await mutateFosters()
    } catch (error) {
      console.error("Error canceling invitation:", error)
      alert("Failed to cancel invitation")
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-bark">Fosters</h1>
          <p className="text-text-muted mt-1">Manage foster families in your organization</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/org/${orgId}/admin/import?type=fosters`}>
            <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </Link>
          <Button onClick={() => setShowInviteModal(true)} className="bg-primary-orange hover:bg-primary-orange/90">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Foster
          </Button>
        </div>
      </div>

      {/* Active Fosters */}
      {fosters.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-primary-bark flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-orange" />
              Active Fosters
            </h2>
            <p className="text-sm text-text-muted mt-1">Fosters currently in your organization</p>
          </div>
          <div className="divide-y divide-gray-100">
            {fosters.map((foster) => {
              const assignedDog = foster.dogs && foster.dogs.length > 0 ? foster.dogs[0] : null

              return (
                <div key={foster.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary-orange/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-orange" />
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/org/${orgId}/admin/fosters/${foster.id}`}
                          className="font-semibold text-primary-bark hover:text-primary-orange transition"
                        >
                          {foster.name || foster.email}
                        </Link>
                        <p className="text-sm text-text-muted">{foster.email}</p>
                        {assignedDog ? (
                          <Link
                            href={`/org/${orgId}/admin/animals/${assignedDog.id}`}
                            className="inline-flex items-center gap-1 mt-1 text-sm text-primary-orange hover:text-primary-orange/80 transition"
                          >
                            <Dog className="w-4 h-4" />
                            Fostering: {assignedDog.name}
                          </Link>
                        ) : (
                          <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            Waiting for animal assignment
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!assignedDog && (
                        <Button
                          onClick={() => {
                            setSelectedFoster(foster)
                            setShowAssignDogModal(true)
                          }}
                          size="sm"
                          className="bg-primary-orange hover:bg-primary-orange/90"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Assign Dog
                        </Button>
                      )}
                      <Button
                        onClick={() => router.push(`/org/${orgId}/admin/fosters/${foster.id}`)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-amber-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-primary-bark flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Pending Invitations
            </h2>
            <p className="text-sm text-text-muted mt-1">Invitations waiting for response</p>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-sm text-text-muted">
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled/Declined Invitations */}
      {cancelledInvitations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-primary-bark flex items-center gap-2">
              <UserX className="w-5 h-5 text-gray-600" />
              Recently Declined
            </h2>
            <p className="text-sm text-text-muted mt-1">Invitations that were declined or cancelled</p>
          </div>
          <div className="divide-y divide-gray-100">
            {cancelledInvitations.slice(0, 5).map((invitation) => (
              <div key={invitation.id} className="p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <UserX className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      {invitation.status === "declined" ? "Declined" : "Cancelled"}{" "}
                      {new Date(invitation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Foster Family</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="py-1.5" htmlFor="email">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="foster@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowInviteModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail || isInviting}
                className="flex-1 bg-primary-orange hover:bg-primary-orange/90"
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dog Modal */}
      <Dialog open={showAssignDogModal} onOpenChange={setShowAssignDogModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Dog to {selectedFoster?.name || selectedFoster?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="dog">Select Dog</Label>
              <Select value={selectedDogId} onValueChange={setSelectedDogId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dog..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDogs.map((dog) => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name} - {dog.breed} ({dog.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowAssignDogModal(false)
                  setSelectedDogId("")
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignDog}
                disabled={!selectedDogId || isAssigning}
                className="flex-1 bg-primary-orange hover:bg-primary-orange/90"
              >
                {isAssigning ? "Assigning..." : "Assign Dog"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
