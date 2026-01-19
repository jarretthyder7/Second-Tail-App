"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { X, Loader2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AppointmentRequestModalProps {
  dog: any
  orgId: string
  onClose: () => void
}

export function AppointmentRequestModal({ dog, orgId, onClose }: AppointmentRequestModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    appointmentType: "",
    preferredDate: "",
    preferredTime: "",
    reason: "",
    notes: "",
  })

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

      toast({
        title: "Request submitted",
        description: "Your appointment request has been sent to the rescue team. They'll respond within 24 hours.",
      })

      onClose()
      router.refresh()
    } catch (error) {
      console.error("[v0] Error submitting appointment request:", error)
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
            >
              <option value="">Select type...</option>
              <option value="vet-checkup">Veterinary Check-up</option>
              <option value="vaccination">Vaccination</option>
              <option value="emergency-vet">Emergency Vet Visit</option>
              <option value="behavioral-consult">Behavioral Consultation</option>
              <option value="grooming">Grooming Appointment</option>
              <option value="training">Training Session</option>
              <option value="foster-meeting">Foster Team Meeting</option>
              <option value="other">Other</option>
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
