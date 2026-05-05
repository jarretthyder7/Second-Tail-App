"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { X, Loader2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  DAY_KEYS,
  DAY_LABELS,
  DEFAULT_HOURS_OF_OPERATION,
  formatTime12h,
  normalizeHours,
  type HoursOfOperation,
} from "@/lib/hours-of-operation"

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
  const [hours, setHours] = useState<HoursOfOperation>(DEFAULT_HOURS_OF_OPERATION)
  const [formData, setFormData] = useState({
    appointmentType: "",
    preferredDate: "",
    preferredTime: "",
    reason: "",
    notes: "",
  })

  useEffect(() => {
    async function fetchOrgSettings() {
      try {
        const response = await fetch(`/api/admin/help-settings?orgId=${orgId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.allowed_appointment_types && data.allowed_appointment_types.length > 0) {
            setAppointmentTypes(data.allowed_appointment_types)
          } else {
            setAppointmentTypes(DEFAULT_APPOINTMENT_TYPES)
          }
          setHours(normalizeHours(data.hours_of_operation))
        } else {
          setAppointmentTypes(DEFAULT_APPOINTMENT_TYPES)
        }
      } catch (error) {
        setAppointmentTypes(DEFAULT_APPOINTMENT_TYPES)
      } finally {
        setLoadingTypes(false)
      }
    }
    fetchOrgSettings()
  }, [orgId])

  // Compute available 15-minute slots for the foster's selected date based on the
  // rescue's hours_of_operation. If the rescue is closed that day, returns [].
  const dayHoursForSelectedDate = useMemo(() => {
    if (!formData.preferredDate) return null
    // Use noon to dodge timezone boundary issues when computing day-of-week.
    const d = new Date(formData.preferredDate + "T12:00:00")
    const dayKey = DAY_KEYS[(d.getDay() + 6) % 7] // JS getDay: Sun=0..Sat=6 → our keys: monday=0
    return { dayKey, hours: hours[dayKey] }
  }, [formData.preferredDate, hours])

  const timeSlots = useMemo(() => {
    const dh = dayHoursForSelectedDate
    if (!dh || dh.hours.closed || !dh.hours.open || !dh.hours.close) return []
    const [openH, openM] = dh.hours.open.split(":").map((n) => parseInt(n, 10))
    const [closeH, closeM] = dh.hours.close.split(":").map((n) => parseInt(n, 10))
    if ([openH, openM, closeH, closeM].some((n) => Number.isNaN(n))) return []
    const startMin = openH * 60 + openM
    const endMin = closeH * 60 + closeM
    const slots: { value: string; label: string }[] = []
    for (let m = startMin; m < endMin; m += 15) {
      const h = Math.floor(m / 60)
      const min = m % 60
      const hh = String(h).padStart(2, "0")
      const mm = String(min).padStart(2, "0")
      const value = `${hh}:${mm}`
      slots.push({ value, label: formatTime12h(value) })
    }
    return slots
  }, [dayHoursForSelectedDate])

  // Clear stale time when date changes or selected slot is no longer in range.
  useEffect(() => {
    if (!formData.preferredTime) return
    if (!timeSlots.some((s) => s.value === formData.preferredTime)) {
      setFormData((prev) => ({ ...prev, preferredTime: "" }))
    }
  }, [timeSlots, formData.preferredTime])

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

      // Notify all org admins via email + push (server resolves recipients
      // and applies their per-user prefs).
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            type: "admin.appointment_request",
            orgId,
            fosterId: user.id,
            dogId: dog.id,
            appointmentType: formData.appointmentType,
            preferredDate: formData.preferredDate,
          },
        }),
      }).catch((err) => console.warn("Failed to notify org admins:", err))

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
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Preferred Time *</label>
              <select
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                disabled={!formData.preferredDate || timeSlots.length === 0}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                required
              >
                <option value="">
                  {!formData.preferredDate
                    ? "Pick a date first"
                    : timeSlots.length === 0
                      ? "Closed this day"
                      : "Select a time..."}
                </option>
                {timeSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {formData.preferredDate && dayHoursForSelectedDate && (
            <p className="-mt-2 text-xs text-muted-foreground">
              {dayHoursForSelectedDate.hours.closed || timeSlots.length === 0
                ? `${DAY_LABELS[dayHoursForSelectedDate.dayKey]}: closed. Pick another day.`
                : `${DAY_LABELS[dayHoursForSelectedDate.dayKey]} hours: ${formatTime12h(dayHoursForSelectedDate.hours.open)} – ${formatTime12h(dayHoursForSelectedDate.hours.close)}`}
            </p>
          )}

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
