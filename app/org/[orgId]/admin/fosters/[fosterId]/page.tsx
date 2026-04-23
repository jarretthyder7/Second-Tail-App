"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Edit, Save, X, Dog, AlertTriangle } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export default function FosterProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <FosterProfileContent />
    </ProtectedRoute>
  )
}

function FosterProfileContent() {
  const params = useParams()
  const router = useRouter()
  const fosterId = params.fosterId as string
  const orgId = params.orgId as string

  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showReturnConfirmation, setShowReturnConfirmation] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [returnSuccess, setReturnSuccess] = useState(false)
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  const {
    data: foster,
    error,
    isLoading,
    mutate,
  } = useSWR(
    fosterId && orgId ? `/api/admin/foster/${fosterId}?orgId=${orgId}` : null,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch foster: ${res.statusText}`)
      }
      return res.json()
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
    },
  )

  useEffect(() => {
    if (foster) {
      setEditedProfile(foster)
    }
  }, [foster])

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const res = await fetch(`/api/admin/foster/${fosterId}?orgId=${orgId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedProfile.name,
          phone: editedProfile.phone,
          address: editedProfile.address,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to save profile")
      }

      await mutate()
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving profile:", error)
      alert(error instanceof Error ? error.message : "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReturnDog = async () => {
    const assignedDog = foster?.dogs?.[0]
    if (!assignedDog) return
    setIsReturning(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("dogs")
        .update({ foster_id: null, stage: "intake", status: "available", updated_at: new Date().toISOString() })
        .eq("id", assignedDog.id)
      if (error) throw error
      setShowReturnConfirmation(false)
      setReturnSuccess(true)
      await mutate()
    } catch (err: any) {
      alert(err.message || "Failed to return dog to rescue. Please try again.")
    } finally {
      setIsReturning(false)
    }
  }

  const handleRemoveFoster = async () => {
    setIsRemoving(true)
    setRemoveError('')
    try {
      const res = await fetch(`/api/admin/foster/${fosterId}?orgId=${orgId}`, {
        method: 'DELETE',
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRemoveError(body?.error || 'Failed to remove foster. Please try again.')
        setIsRemoving(false)
        return
      }
      // Success — redirect back to fosters list
      router.push(`/org/${orgId}/admin/fosters`)
    } catch (err: any) {
      setRemoveError(err.message || 'Failed to remove foster. Please try again.')
      setIsRemoving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto"></div>
          <p className="mt-4 text-text-muted">Loading foster profile...</p>
        </div>
      </div>
    )
  }

  if (error || !foster) {
    return (
      <div className="min-h-screen bg-neutral-cream">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-primary-bark">Foster Profile Not Found</h2>
            <p className="text-text-muted max-w-md mx-auto">
              {error?.message ||
                "The foster profile you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <Link href={`/org/${orgId}/admin/fosters`}>
              <Button className="bg-primary-orange hover:bg-primary-orange/90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Fosters List
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const assignedDog = foster.dogs?.[0]

  return (
    <div className="min-h-screen bg-neutral-cream">
      {showReturnConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-bark">Return Dog to Rescue</h3>
            </div>
            <p className="text-primary-bark/80 mb-6">
              Are you sure you want to return <strong>{foster?.dogs?.[0]?.name}</strong> to rescue care and remove this
              dog from <strong>{foster?.name || foster?.email}</strong>?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowReturnConfirmation(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturnDog}
                disabled={isReturning}
                className="flex-1 bg-primary-orange hover:bg-primary-orange/90"
              >
                {isReturning ? "Returning..." : "Confirm Return"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/org/${orgId}/admin/fosters`}
            className="inline-flex items-center gap-2 text-sm text-primary-bark hover:text-primary-orange"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fosters
          </Link>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="border-primary-orange text-primary-orange hover:bg-primary-orange hover:text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-bark mb-2">{foster.name || foster.email}</h1>
              <p className="text-neutral-charcoal/60">{foster.email}</p>
              <div className="flex gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-sage/10 text-primary-sage">
                  Foster
                </span>
                {assignedDog && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-orange/10 text-primary-orange">
                    Active - Fostering {assignedDog.name}
                  </span>
                )}
                {!assignedDog && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Awaiting Assignment
                  </span>
                )}
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4 pt-4 border-t border-neutral-cream">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editedProfile.name || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editedProfile.phone || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={editedProfile.address || ""}
                  onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary-orange hover:bg-primary-orange/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedProfile(foster)
                  }}
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4 border-t border-neutral-cream">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-charcoal/60 mb-1">Phone</h3>
                  <p className="text-primary-bark">{foster.phone || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-charcoal/60 mb-1">Address</h3>
                  <p className="text-primary-bark">{foster.address || "Not provided"}</p>
                </div>
              </div>

              {assignedDog && (
                <div className="pt-4 border-t border-neutral-cream">
                  <h3 className="text-lg font-semibold text-primary-bark mb-3">Currently Fostering</h3>
                  {returnSuccess ? (
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
                      {assignedDog.name} has been returned to rescue care.
                    </div>
                  ) : (
                    <>
                      <Link
                        href={`/org/${orgId}/admin/animals/${assignedDog.id}`}
                        className="flex items-center gap-4 p-4 rounded-xl bg-neutral-cream hover:bg-primary-orange/5 border border-transparent hover:border-primary-orange transition-colors"
                      >
                        <img
                          src={assignedDog.image_url || "/placeholder.svg?height=80&width=80&query=dog"}
                          alt={assignedDog.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-primary-bark">{assignedDog.name}</h4>
                          <p className="text-sm text-neutral-charcoal/60">{assignedDog.breed}</p>
                        </div>
                        <Dog className="w-5 h-5 text-primary-orange" />
                      </Link>
                      <Button
                        onClick={() => setShowReturnConfirmation(true)}
                        variant="outline"
                        className="mt-3 w-full border-neutral-charcoal/20 text-primary-bark hover:bg-neutral-cream"
                      >
                        Return Dog to Rescue
                      </Button>
                    </>
                  )}
                </div>
              )}

              {!assignedDog && (
                <div className="pt-4 border-t border-neutral-cream">
                  <div className="text-center py-8 px-4 bg-amber-50 rounded-xl border border-amber-200">
                    <Dog className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-amber-900 mb-1">No Dog Assigned Yet</h3>
                    <p className="text-sm text-amber-700">
                      This foster is waiting for a dog assignment. Visit the fosters list to assign a dog.
                    </p>
                    <Link href={`/org/${orgId}/admin/fosters`}>
                      <Button className="mt-4 bg-primary-orange hover:bg-primary-orange/90" size="sm">
                        Go to Fosters List
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Danger zone — remove foster from this rescue's network */}
              <div className="pt-6 mt-6 border-t border-red-100">
                <h3 className="font-semibold text-red-900 mb-1">Danger zone</h3>
                <p className="text-sm text-neutral-charcoal/60 mb-3">
                  Remove this foster from {foster?.organization?.name || 'your rescue'}. Any dogs assigned to them will be unassigned. They&apos;ll go back to an unconnected foster state and can be onboarded by another rescue.
                </p>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setShowRemoveConfirmation(true)}
                >
                  Remove foster from network
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showRemoveConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-primary-bark">Remove {foster?.name || 'this foster'}?</h3>
                <p className="text-sm text-neutral-charcoal/70 mt-1">
                  {foster?.dogs?.length > 0
                    ? `They currently have ${foster.dogs.length} dog${foster.dogs.length === 1 ? '' : 's'} assigned. Those dogs will be unassigned and returned to your rescue.`
                    : 'No dogs are currently assigned to them.'}
                </p>
                <p className="text-sm text-neutral-charcoal/70 mt-2">
                  This foster will lose access to your organization&apos;s dashboard. They&apos;ll land on the unconnected foster view next time they log in.
                </p>
              </div>
            </div>
            {removeError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                {removeError}
              </div>
            )}
            <div className="flex gap-3 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRemoveConfirmation(false)
                  setRemoveError('')
                }}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveFoster}
                disabled={isRemoving}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isRemoving ? 'Removing…' : 'Yes, remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
