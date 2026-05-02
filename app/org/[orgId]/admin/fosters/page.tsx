"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dog, Mail, UserPlus, X, Clock, AlertCircle, UserX, User, Users, Plus, Eye, Upload, Trash2 } from "lucide-react"
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
  const [selectedInviteIds, setSelectedInviteIds] = useState<Set<string>>(new Set())
  const [showBulkCancelDialog, setShowBulkCancelDialog] = useState(false)
  const [isBulkCanceling, setIsBulkCanceling] = useState(false)
  const [bulkCancelError, setBulkCancelError] = useState<string | null>(null)
  const [selectedFosterIds, setSelectedFosterIds] = useState<Set<string>>(new Set())
  const [showBulkRemoveDialog, setShowBulkRemoveDialog] = useState(false)
  const [isBulkRemoving, setIsBulkRemoving] = useState(false)
  const [bulkRemoveError, setBulkRemoveError] = useState<string | null>(null)

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
          console.warn("Failed to send assignment email:", emailError)
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
        console.warn("Warning: Failed to create journey event:", eventError)
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
          console.warn("Invitation email failed to send:", emailError)
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

  const toggleInviteSelect = (id: string) => {
    setSelectedInviteIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allPendingSelected =
    pendingInvitations.length > 0 && pendingInvitations.every((i: any) => selectedInviteIds.has(i.id))

  const togglePendingSelectAll = () => {
    setSelectedInviteIds((prev) => {
      if (allPendingSelected) {
        const next = new Set(prev)
        pendingInvitations.forEach((i: any) => next.delete(i.id))
        return next
      }
      const next = new Set(prev)
      pendingInvitations.forEach((i: any) => next.add(i.id))
      return next
    })
  }

  const toggleFosterSelect = (id: string) => {
    setSelectedFosterIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allActiveSelected = fosters.length > 0 && fosters.every((f: any) => selectedFosterIds.has(f.id))

  const toggleActiveSelectAll = () => {
    setSelectedFosterIds((prev) => {
      if (allActiveSelected) {
        const next = new Set(prev)
        fosters.forEach((f: any) => next.delete(f.id))
        return next
      }
      const next = new Set(prev)
      fosters.forEach((f: any) => next.add(f.id))
      return next
    })
  }

  const selectedFostersWithDogs = fosters
    .filter((f: any) => selectedFosterIds.has(f.id))
    .filter((f: any) => f.dogs && f.dogs.length > 0)

  const handleBulkRemoveFromOrg = async () => {
    if (selectedFosterIds.size === 0) return
    setIsBulkRemoving(true)
    setBulkRemoveError(null)

    try {
      const ids = Array.from(selectedFosterIds)
      const res = await fetch("/api/admin/fosters", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, orgId }),
      })
      const result = await res.json().catch(() => ({}))

      if (!res.ok) {
        setBulkRemoveError(result.error || `Remove failed (${res.status})`)
        return
      }

      const removed: number = result.removed ?? 0
      const requested: number = result.requested ?? ids.length

      if (removed === 0) {
        setBulkRemoveError(
          "No fosters were removed. They may have already left the org, or your account may not have permission.",
        )
        return
      }

      setSelectedFosterIds(new Set())
      setShowBulkRemoveDialog(false)
      await mutateFosters()

      if (removed < requested) {
        setBulkRemoveError(
          `Removed ${removed} of ${requested}. Some couldn't be removed — refresh to see the current state.`,
        )
      }
    } catch (err) {
      console.error("Bulk remove error:", err)
      setBulkRemoveError("Something went wrong. Please try again.")
    } finally {
      setIsBulkRemoving(false)
    }
  }

  const handleBulkCancelInvitations = async () => {
    if (selectedInviteIds.size === 0) return
    setIsBulkCanceling(true)
    setBulkCancelError(null)

    try {
      const ids = Array.from(selectedInviteIds)
      const supabase = createClient()
      const { data, error } = await supabase.from("invitations").delete().in("id", ids).select("id")

      if (error) {
        console.error("Bulk cancel failed:", error)
        setBulkCancelError(error.message || "Failed to cancel. You may not have permission for these records.")
        return
      }

      const deleted = (data || []).length
      if (deleted === 0) {
        setBulkCancelError(
          "No invitations were cancelled. They may have already been removed, or your account may not have permission.",
        )
        return
      }

      setSelectedInviteIds(new Set())
      setShowBulkCancelDialog(false)
      await mutateFosters()

      if (deleted < ids.length) {
        setBulkCancelError(
          `Cancelled ${deleted} of ${ids.length}. Some couldn't be removed — refresh to see the current state.`,
        )
      }
    } catch (err) {
      console.error("Bulk cancel error:", err)
      setBulkCancelError("Something went wrong. Please try again.")
    } finally {
      setIsBulkCanceling(false)
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
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary-bark flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-orange" />
                Active Fosters
              </h2>
              <p className="text-sm text-text-muted mt-1">Fosters currently in your organization</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allActiveSelected}
                onChange={toggleActiveSelectAll}
                aria-label="Select all active fosters"
                className="w-4 h-4 rounded border-gray-300 text-primary-orange focus:ring-primary-orange cursor-pointer"
              />
              Select all
            </label>
          </div>

          {selectedFosterIds.size > 0 && (
            <div className="px-6 py-3 bg-primary-orange/5 border-b border-primary-orange/20 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-800">
                {selectedFosterIds.size} foster{selectedFosterIds.size === 1 ? "" : "s"} selected
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFosterIds(new Set())}
                  className="border-gray-200 text-gray-700 hover:bg-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setBulkRemoveError(null)
                    setShowBulkRemoveDialog(true)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Remove from org
                </Button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {fosters.map((foster: any) => {
              const assignedDog = foster.dogs && foster.dogs.length > 0 ? foster.dogs[0] : null

              return (
                <div
                  key={foster.id}
                  className={`p-4 transition ${
                    selectedFosterIds.has(foster.id) ? "bg-primary-orange/5" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedFosterIds.has(foster.id)}
                        onChange={() => toggleFosterSelect(foster.id)}
                        aria-label={`Select ${foster.name || foster.email}`}
                        className="w-4 h-4 rounded border-gray-300 text-primary-orange focus:ring-primary-orange cursor-pointer flex-shrink-0"
                      />
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
          <div className="bg-amber-50 px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary-bark flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Pending Invitations
              </h2>
              <p className="text-sm text-text-muted mt-1">Invitations waiting for response</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allPendingSelected}
                onChange={togglePendingSelectAll}
                aria-label="Select all pending invitations"
                className="w-4 h-4 rounded border-gray-300 text-primary-orange focus:ring-primary-orange cursor-pointer"
              />
              Select all
            </label>
          </div>

          {selectedInviteIds.size > 0 && (
            <div className="px-6 py-3 bg-amber-50/50 border-b border-amber-200 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-800">
                {selectedInviteIds.size} invitation{selectedInviteIds.size === 1 ? "" : "s"} selected
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInviteIds(new Set())}
                  className="border-gray-200 text-gray-700 hover:bg-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setBulkCancelError(null)
                    setShowBulkCancelDialog(true)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Cancel {selectedInviteIds.size}
                </Button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {pendingInvitations.map((invitation: any) => (
              <div
                key={invitation.id}
                className={`p-6 transition-colors ${
                  selectedInviteIds.has(invitation.id) ? "bg-amber-50/40" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedInviteIds.has(invitation.id)}
                      onChange={() => toggleInviteSelect(invitation.id)}
                      aria-label={`Select ${invitation.email}`}
                      className="w-4 h-4 rounded border-gray-300 text-primary-orange focus:ring-primary-orange cursor-pointer flex-shrink-0"
                    />
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{invitation.email}</p>
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

      {/* Bulk remove-from-org confirmation */}
      <Dialog
        open={showBulkRemoveDialog}
        onOpenChange={(open) => !isBulkRemoving && setShowBulkRemoveDialog(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Remove {selectedFosterIds.size} foster{selectedFosterIds.size === 1 ? "" : "s"} from your org?
            </DialogTitle>
            <DialogDescription>
              This removes the foster{selectedFosterIds.size === 1 ? "" : "s"} from{" "}
              <strong>your organization only</strong>. Their Second Tail account stays active so they can join
              another rescue later.
            </DialogDescription>
          </DialogHeader>

          {selectedFostersWithDogs.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <p className="font-medium mb-1">
                {selectedFostersWithDogs.length} of the selected foster
                {selectedFostersWithDogs.length === 1 ? " has" : "s have"} an animal assigned:
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {selectedFostersWithDogs.slice(0, 5).map((f: any) => (
                  <li key={f.id}>
                    {f.name || f.email} → {f.dogs.map((d: any) => d.name).join(", ")}
                  </li>
                ))}
                {selectedFostersWithDogs.length > 5 && (
                  <li>+ {selectedFostersWithDogs.length - 5} more</li>
                )}
              </ul>
              <p className="mt-2">
                Those animals will be unassigned and set back to <strong>available</strong>.
              </p>
            </div>
          )}

          {bulkRemoveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {bulkRemoveError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkRemoveDialog(false)}
              disabled={isBulkRemoving}
            >
              Keep them
            </Button>
            <Button
              type="button"
              onClick={handleBulkRemoveFromOrg}
              disabled={isBulkRemoving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isBulkRemoving
                ? "Removing..."
                : `Remove ${selectedFosterIds.size} foster${selectedFosterIds.size === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk-cancel confirmation */}
      <Dialog
        open={showBulkCancelDialog}
        onOpenChange={(open) => !isBulkCanceling && setShowBulkCancelDialog(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cancel {selectedInviteIds.size} invitation{selectedInviteIds.size === 1 ? "" : "s"}?
            </DialogTitle>
            <DialogDescription>
              The selected pending invitation{selectedInviteIds.size === 1 ? "" : "s"} will be deleted. The signup
              link{selectedInviteIds.size === 1 ? "" : "s"} will stop working immediately. This can't be undone.
            </DialogDescription>
          </DialogHeader>

          {bulkCancelError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {bulkCancelError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkCancelDialog(false)}
              disabled={isBulkCanceling}
            >
              Keep them
            </Button>
            <Button
              type="button"
              onClick={handleBulkCancelInvitations}
              disabled={isBulkCanceling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isBulkCanceling
                ? "Canceling..."
                : `Cancel ${selectedInviteIds.size} invitation${selectedInviteIds.size === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
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
