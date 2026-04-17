"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Clock, MapPin, Package, Mail, User, X, AlertCircle, MessageSquare } from "lucide-react"

interface AppointmentDetailModalProps {
  appointment: any
  onClose: () => void
}

export function AppointmentDetailModal({ appointment, onClose }: AppointmentDetailModalProps) {
  const [staffContact, setStaffContact] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [rescheduleReason, setRescheduleReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadStaffContact = async () => {
      if (!appointment.assigned_to) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data } = await supabase.from("profiles").select("*").eq("id", appointment.assigned_to).single()

      setStaffContact(data)
      setLoading(false)
    }

    loadStaffContact()
  }, [appointment.assigned_to])

  const handleReschedule = async () => {
    if (!rescheduleReason.trim()) return
    setSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from("help_requests").insert({
        dog_id: appointment.dog_id,
        foster_id: user.id,
        organization_id: appointment.organization_id,
        type: "appointment_change",
        title: `Reschedule Request: ${appointment.title}`,
        description: `Original appointment: ${new Date(appointment.start_time).toLocaleString()}\n\nReason for change: ${rescheduleReason}`,
        category: "appointment",
        status: "open",
        priority: "normal",
      })

      setShowRescheduleForm(false)
      setRescheduleReason("")
      alert("Reschedule request submitted! The team will contact you soon.")
    } catch (error) {
      // Error submitting reschedule
    } finally {
      setSubmitting(false)
    }
  }

  const typeLabels: Record<string, string> = {
    vet_visit: "Vet Visit",
    home_check: "Home Check",
    drop_off: "Drop Off",
    pick_up: "Pick Up",
    training: "Training",
    meet_and_greet: "Meet & Greet",
    foster_check_in: "Foster Check-In",
    team_meeting: "Team Meeting",
    other: "Other",
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#F7E2BD] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#5A4A42]">{appointment.title}</h3>
            <p className="text-sm text-[#2E2E2E]/70">{typeLabels[appointment.appointment_type]}</p>
          </div>
          <button onClick={onClose} className="text-[#2E2E2E]/60 hover:text-[#2E2E2E] transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Date & Time */}
          <div>
            <h4 className="font-semibold text-[#5A4A42] mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Date & Time
            </h4>
            <p className="text-[#2E2E2E] font-medium">{new Date(appointment.start_time).toLocaleString()}</p>
            {appointment.end_time && (
              <p className="text-sm text-[#2E2E2E]/70">Ends at {new Date(appointment.end_time).toLocaleTimeString()}</p>
            )}
          </div>

          {/* Location */}
          {appointment.location && (
            <div>
              <h4 className="font-semibold text-[#5A4A42] mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </h4>
              <p className="text-[#2E2E2E]">{appointment.location}</p>
            </div>
          )}

          {/* Arrival Instructions */}
          {appointment.description && (
            <div>
              <h4 className="font-semibold text-[#5A4A42] mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Arrival Instructions
              </h4>
              <p className="text-[#2E2E2E] text-sm leading-relaxed">{appointment.description}</p>
            </div>
          )}

          {/* Items to Bring */}
          {appointment.items_needed && appointment.items_needed.length > 0 && (
            <div>
              <h4 className="font-semibold text-[#5A4A42] mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Items to Bring
              </h4>
              <ul className="space-y-2">
                {appointment.items_needed.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#D76B1A] mt-1">•</span>
                    <span className="text-[#2E2E2E]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Information */}
          {!loading && (
            <div className="bg-[#F7E2BD]/30 rounded-xl p-4">
              <h4 className="font-semibold text-[#5A4A42] mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Point of Contact
              </h4>
              {staffContact ? (
                <div className="space-y-3">
                  <p className="text-[#2E2E2E] font-medium">{staffContact.name}</p>
                  {staffContact.email && (
                    <a
                      href={`mailto:${staffContact.email}`}
                      className="flex items-center gap-2 text-[#D76B1A] hover:underline"
                    >
                      <Mail className="w-4 h-4" />
                      {staffContact.email}
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[#2E2E2E]/70">No specific contact assigned yet.</p>
                  <a
                    href={`mailto:${appointment.organization_id}?subject=Question about ${appointment.title}`}
                    className="block w-full text-center rounded-xl bg-[#D76B1A]/10 px-4 py-2.5 text-sm font-semibold text-[#D76B1A] hover:bg-[#D76B1A]/20 transition"
                  >
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Contact Main Team
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t border-[#F7E2BD]">
            {showRescheduleForm ? (
              <div className="space-y-3">
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Why do you need to reschedule?"
                  className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] resize-none min-h-[80px]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReschedule}
                    disabled={submitting || !rescheduleReason.trim()}
                    className="flex-1 rounded-xl bg-[#D76B1A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                  <button
                    onClick={() => {
                      setShowRescheduleForm(false)
                      setRescheduleReason("")
                    }}
                    className="flex-1 rounded-xl border-2 border-[#F7E2BD] px-4 py-2.5 text-sm font-semibold text-[#5A4A42] hover:bg-[#F7E2BD]/20 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowRescheduleForm(true)}
                  className="w-full rounded-xl border-2 border-[#F7E2BD] px-4 py-2.5 text-sm font-semibold text-[#5A4A42] hover:bg-[#F7E2BD]/20 transition"
                >
                  Request to Reschedule
                </button>

                {staffContact?.email && (
                  <a
                    href={`mailto:${staffContact.email}?subject=Question about ${appointment.title}`}
                    className="block w-full text-center rounded-xl bg-[#D76B1A]/10 px-4 py-2.5 text-sm font-semibold text-[#D76B1A] hover:bg-[#D76B1A]/20 transition"
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Contact
                  </a>
                )}
              </>
            )}
          </div>

          {/* Additional Notes */}
          {appointment.notes && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 text-sm mb-1">Additional Notes</p>
                  <p className="text-sm text-blue-800">{appointment.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
