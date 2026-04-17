"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { X, Loader2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AppointmentRequestModalProps {
  dog: any
  orgId: string
  onClose: () => void
}

const DEFAULT_APPOINTMENT_TYPES = ["Vet Visit", "Checkup", "Vaccination", "Dental", "Emergency"]

export function AppointmentRequestModal({ dog, orgId, onClose }: AppointmentRequestModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [appointmentTypes, setAppointmentTypes] = useState<string[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [formData, setFormData] = useState({
    appointmentType: "",
    preferredDate: "",
    preferredTime: "",
    reason: "",
    notes: "",
  })

  useEffect(() => {
    async function fetchAppointmentTypes() {
      try {
        const response = await fetch(`/api/admin/help-settings?orgId=${orgId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.allowed_appointment_types && data.allowed_appointment_types.length > 0) {
            setAppointmentTypes(data.allowed_appointment_types)
          } else {
            setAppointmentTypes(DEFAULT_APPOINTMENT_TYPES)
          }
        } else {
          setAppointmentTypes(DEFAULT_APPOINTMENT_TYPES)
        }
      } catch (error) {
        setAppointmentTypes(DEFAULT_APPOINTMENT_TYPES)
      } finally {
        setLoadingTypes(false)
      }
    }
    fetchAppointmentTypes()
  }, [orgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to request an appointment.",
          variant: "destructive",
        })
        return
      }

      // Insert appointment request into database
      const { error } = await supabase.from("appointment_requests").insert({
        dog_id: dog.id,
        foster_id: user.id,
        organization_id: orgId,
        appointment_type: formData.appointmentType,
        preferred_date: formData.preferredDate,
        preferred_time: formData.preferredTime,
        reason: formData.reason,
        notes: formData.notes,
        status: "pending",
      })

      if (error) throw error

      // Get org admin email to send notification
      const { data: orgAdmin, error: adminError } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("organization_id", orgId)
        .eq("role", "rescue")
        .eq("org_role", "org_admin")
        .maybeSingle()

      if (!adminError && orgAdmin) {
        // Get current user (foster) details
        const { data: currentUser } = await supabase.from("profiles").select("name").eq("id", user.id).single()

        // Get org name
        const { data: org } = await supabase.from("organizations").select("name").eq("id", orgId).single()

        if (currentUser && org) {
          // Send email notification to org admin
          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "appointment-request",
              orgEmail: orgAdmin.email,
              orgName: org.name,
              fosterName: currentUser.name,
              dogName: dog.name,
              appointmentType: formData.appointmentType,
              preferredDate: formData.preferredDate,
            }),
          })
        }
      }

      toast({
        title: "Request submitted",
        description: "Your appointment request has been sent to the rescue team. They'll respond within 24 hours.",
      })

      onClose()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Request Appointment</h3>
              <p className="text-xs text-muted-foreground">For {dog.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Appointment Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Appointment Type *</label>
            <select
              value={formData.appointmentType}
              onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
              disabled={loadingTypes}
            >
              {loadingTypes ? (
                <option value="">Loading...</option>
              ) : (
                <>
                  <option value="">Select type...</option>
                  {appointmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Preferred Date *</label>
              <input
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Preferred Time *</label>
              <input
                type="time"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Reason for Appointment *</label>
            <input
              type="text"
              placeholder="e.g., Regular check-up, behavioral concern, etc."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Additional Notes</label>
            <textarea
              placeholder="Any additional details about your request..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 font-semibold text-foreground hover:bg-secondary transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
