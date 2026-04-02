"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"

const Phone = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const Calendar = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </svg>
)

const Package = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
)

const AlertTriangle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
)

interface RequestHelpModalProps {
  dog: any
  onClose: () => void
  initialView?: MainOption // Add initialView prop
}

type MainOption = "menu" | "call" | "appointment" | "supplies" | "emergency"

export function RequestHelpModal({ dog, onClose, initialView = "menu" }: RequestHelpModalProps) {
  // Accept initialView prop with default "menu"
  const params = useParams()
  const orgId = params.orgId as string

  const [settings, setSettings] = useState<any>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  const [currentView, setCurrentView] = useState<MainOption>(initialView) // Initialize with initialView prop instead of hardcoded "menu"
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form states
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [appointmentReason, setAppointmentReason] = useState("")

  const [suppliesChecklist, setSuppliesChecklist] = useState<string[]>([])
  const [suppliesNotes, setSuppliesNotes] = useState("")

  const [emergencyDanger, setEmergencyDanger] = useState<boolean | null>(null)
  const [emergencySymptoms, setEmergencySymptoms] = useState("")
  const [emergencyWhen, setEmergencyWhen] = useState("")

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/admin/help-settings?orgId=${orgId}`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch help settings:", error)
      } finally {
        setSettingsLoading(false)
      }
    }

    fetchSettings()
  }, [orgId])

  const handleSubmitAppointment = async () => {
    if (!appointmentReason.trim()) return
    setSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from("help_requests").insert({
        dog_id: dog?.id || null,
        foster_id: user.id,
        organization_id: orgId,
        type: "appointment",
        title: "Appointment Requested",
        description: appointmentReason,
        category: "appointment",
        status: "open",
        priority: "normal",
      })

      setSubmitting(false)
      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    } catch (error) {
      console.error("[v0] Failed to submit appointment:", error)
      setSubmitting(false)
    }
  }

  const handleSubmitSupplies = async () => {
    if (suppliesChecklist.length === 0) return
    setSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const description = `Supplies requested: ${suppliesChecklist.join(", ")}${suppliesNotes ? ". Notes: " + suppliesNotes : ""}`

      await supabase.from("help_requests").insert({
        dog_id: dog?.id || null,
        foster_id: user.id,
        organization_id: orgId,
        type: "supplies",
        title: "Supplies Requested",
        description,
        category: "supplies",
        status: "open",
        priority: "normal",
      })

      setSubmitting(false)
      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    } catch (error) {
      console.error("[v0] Failed to submit supplies request:", error)
      setSubmitting(false)
    }
  }

  const handleSubmitEmergency = async () => {
    if (!emergencySymptoms.trim()) return
    setSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const description = `EMERGENCY: ${emergencySymptoms}. Started: ${emergencyWhen}`

      await supabase.from("help_requests").insert({
        dog_id: dog?.id || null,
        foster_id: user.id,
        organization_id: orgId,
        type: "emergency",
        title: "Emergency Reported",
        description,
        category: "emergency",
        status: "open",
        priority: "high",
      })

      setSubmitting(false)
      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    } catch (error) {
      console.error("[v0] Failed to submit emergency:", error)
      setSubmitting(false)
    }
  }

  const toggleSupply = (supply: string) => {
    if (suppliesChecklist.includes(supply)) {
      setSuppliesChecklist(suppliesChecklist.filter((s) => s !== supply))
    } else {
      setSuppliesChecklist([...suppliesChecklist, supply])
    }
  }

  const handleBackClick = () => {
    if (initialView !== "menu") {
      onClose()
    } else {
      setCurrentView("menu")
    }
  }

  if (settingsLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-4 border-[#D76B1A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5A4A42]">Loading contact information...</p>
        </div>
      </div>
    )
  }

  const contactPhone = settings?.contact_phone || "555-0100"
  const emergencyPhone = settings?.emergency_phone || "555-0911"
  const allowedSupplies = settings?.allowed_supply_types || [
    "Food",
    "Pee Pads",
    "Crate",
    "Toys",
    "Leash",
    "Medications",
    "Other",
  ]
  const allowedAppointmentTypes = settings?.allowed_appointment_types || [
    "Vet Visit",
    "Checkup",
    "Vaccination",
    "Dental",
    "Emergency",
  ]
  const suppliesEnabled = settings?.supplies_request_enabled !== false
  const appointmentsEnabled = settings?.appointment_booking_enabled !== false
  const emergencyEnabled = settings?.emergency_support_enabled !== false

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#F7E2BD] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#5A4A42]">Contact Shelter</h3>
            <p className="text-sm text-[#2E2E2E]/70">For {dog.name}</p>
            {/* Use organization name from settings if available, otherwise fallback to mock data */}
            {settings && settings.organization_name && (
              <p className="text-xs text-[#2E2E2E]/60">via {settings.organization_name}</p>
            )}
            {!settings && dog.organization_name && <p className="text-xs text-[#2E2E2E]/60">via {dog.organization_name}</p>}
          </div>
          <button onClick={onClose} className="text-[#2E2E2E]/60 hover:text-[#2E2E2E] transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-[#E8EFE6] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#5A4A42]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-[#5A4A42] mb-2">Request submitted!</h4>
              <p className="text-sm text-[#2E2E2E]/70">The rescue team will get back to you soon.</p>
            </div>
          ) : (
            <>
              {/* Main Menu */}
              {currentView === "menu" && (
                <div className="space-y-3">
                  <p className="text-sm text-[#2E2E2E]/70 mb-4">How can we help you today?</p>

                  {/* Call Team - Always available */}
                  <button
                    onClick={() => setCurrentView("call")}
                    className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-[#F7E2BD] hover:border-[#5A4A42] hover:bg-[#F7E2BD]/20 transition text-left"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-[#E8EFE6] rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-[#5A4A42]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#5A4A42]">Call Team</h4>
                      <p className="text-sm text-[#2E2E2E]/70">Speak directly with our staff</p>
                    </div>
                  </button>

                  {appointmentsEnabled && (
                    <button
                      onClick={() => setCurrentView("appointment")}
                      className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-[#F7E2BD] hover:border-[#5A4A42] hover:bg-[#F7E2BD]/20 transition text-left"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-[#E8EFE6] rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-[#5A4A42]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#5A4A42]">Request Appointment</h4>
                        <p className="text-sm text-[#2E2E2E]/70">Schedule a vet visit or checkup</p>
                      </div>
                    </button>
                  )}

                  {suppliesEnabled && (
                    <button
                      onClick={() => setCurrentView("supplies")}
                      className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-[#F7E2BD] hover:border-[#5A4A42] hover:bg-[#F7E2BD]/20 transition text-left"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-[#E8EFE6] rounded-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-[#5A4A42]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#5A4A42]">Request Supplies</h4>
                        <p className="text-sm text-[#2E2E2E]/70">Food, toys, medications, etc.</p>
                      </div>
                    </button>
                  )}

                  {emergencyEnabled && (
                    <button
                      onClick={() => setCurrentView("emergency")}
                      className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-[#D97A68] bg-[#D97A68]/5 hover:bg-[#D97A68]/10 transition text-left"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-[#D97A68] rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#D97A68]">Emergency</h4>
                        <p className="text-sm text-[#2E2E2E]/70">Urgent medical or safety issue</p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Call Team View - Use real phone numbers from settings */}
              {currentView === "call" && (
                <div className="space-y-4">
                  <button onClick={handleBackClick} className="text-sm text-[#5A4A42] hover:underline mb-4">
                    ← Back
                  </button>

                  <h4 className="font-semibold text-[#5A4A42] mb-3">Contact options:</h4>

                  <a
                    href={`tel:${contactPhone}`}
                    className="block p-4 rounded-xl bg-[#F7E2BD]/40 hover:bg-[#F7E2BD]/60 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#5A4A42]">Foster Support</p>
                        <p className="text-sm text-[#2E2E2E]/70">General questions & support</p>
                      </div>
                      <span className="text-[#D76B1A] font-semibold">{contactPhone}</span>
                    </div>
                  </a>

                  <a
                    href={`tel:${emergencyPhone}`}
                    className="block p-4 rounded-xl bg-[#D97A68] hover:bg-[#D97A68]/90 text-white transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Emergency Line</p>
                        <p className="text-sm text-white/80">Life-threatening situations</p>
                      </div>
                      <span className="font-semibold">{emergencyPhone}</span>
                    </div>
                  </a>
                </div>
              )}

              {/* Request Appointment View */}
              {currentView === "appointment" && (
                <div className="space-y-4">
                  <button onClick={handleBackClick} className="text-sm text-[#5A4A42] hover:underline mb-4">
                    ← Back
                  </button>

                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">Preferred Date</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">Preferred Time</label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">Reason for Appointment *</label>
                    <textarea
                      value={appointmentReason}
                      onChange={(e) => setAppointmentReason(e.target.value)}
                      placeholder="Why does your foster dog need to see the vet?"
                      className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] resize-none min-h-[100px]"
                    />
                  </div>

                  <button
                    onClick={handleSubmitAppointment}
                    disabled={submitting || !appointmentReason.trim()}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              )}

              {/* Request Supplies View - Use allowed supplies from settings */}
              {currentView === "supplies" && (
                <div className="space-y-4">
                  <button onClick={handleBackClick} className="text-sm text-[#5A4A42] hover:underline mb-4">
                    
                  </button>

                  <div className="my-2.5">
                    <label className="block text-sm font-medium text-[#5A4A42] mb-3">
                      What supplies do you need? *
                    </label>
                    <div className="space-y-2">
                      {allowedSupplies.map((supply: string) => (
                        <label
                          key={supply}
                          className="flex items-center gap-3 p-3 rounded-xl border border-[#F7E2BD] hover:bg-[#F7E2BD]/20 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={suppliesChecklist.includes(supply)}
                            onChange={() => toggleSupply(supply)}
                            className="w-4 h-4 text-[#D76B1A] rounded focus:ring-[#D76B1A]"
                          />
                          <span className="text-sm text-[#5A4A42]">{supply}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">Additional Notes</label>
                    <textarea
                      value={suppliesNotes}
                      onChange={(e) => setSuppliesNotes(e.target.value)}
                      placeholder="Any specific details or preferences..."
                      className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] resize-none min-h-[80px]"
                    />
                  </div>

                  <button
                    onClick={handleSubmitSupplies}
                    disabled={submitting || suppliesChecklist.length === 0}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              )}

              {/* Emergency View */}
              {currentView === "emergency" && (
                <div className="space-y-4">
                  <button onClick={handleBackClick} className="text-sm text-[#5A4A42] hover:underline mb-4">
                    ← Back
                  </button>

                  {emergencyDanger === null && (
                    <div className="space-y-4">
                      <div className="bg-[#D97A68]/10 border-2 border-[#D97A68] rounded-xl p-4">
                        <h4 className="font-semibold text-[#D97A68] mb-2">Emergency Assessment</h4>
                        <p className="text-sm text-[#2E2E2E]/80 mb-4">
                          Is your foster dog in immediate life-threatening danger?
                        </p>

                        <div className="space-y-2">
                          <button
                            onClick={() => setEmergencyDanger(true)}
                            className="w-full p-3 rounded-xl bg-[#D97A68] text-white font-semibold hover:bg-[#D97A68]/90 transition"
                          >
                            Yes - Immediate Danger
                          </button>
                          <button
                            onClick={() => setEmergencyDanger(false)}
                            className="w-full p-3 rounded-xl border-2 border-[#D97A68] text-[#D97A68] font-semibold hover:bg-[#D97A68]/10 transition"
                          >
                            No - Urgent but Not Life-Threatening
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {emergencyDanger === true && (
                    <div className="bg-[#D97A68]/10 border-2 border-[#D97A68] rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-[#D97A68] text-lg">Call Emergency Vet Now</h4>
                      <p className="text-sm text-[#2E2E2E]/80">Your foster dog needs immediate veterinary care.</p>

                      <div className="space-y-2 mt-4">
                        <a
                          href={`tel:${emergencyPhone}`}
                          className="block w-full p-4 rounded-xl bg-[#D97A68] text-white font-bold text-center hover:bg-[#D97A68]/90 transition"
                        >
                          Call Emergency Line: {emergencyPhone}
                        </a>

                        <div className="pt-3 border-t border-[#D97A68]/30">
                          <p className="text-xs font-semibold text-[#5A4A42] mb-2">Emergency Steps:</p>
                          <ul className="text-xs text-[#2E2E2E]/80 space-y-1 list-disc list-inside">
                            <li>Keep your dog calm and comfortable</li>
                            <li>Do not give food or water unless instructed</li>
                            <li>Prepare to transport immediately</li>
                            <li>Bring medical records if possible</li>
                          </ul>
                        </div>
                      </div>

                      <button
                        onClick={() => setEmergencyDanger(null)}
                        className="w-full text-sm text-[#5A4A42] hover:underline mt-4"
                      >
                        ← Go Back
                      </button>
                    </div>
                  )}

                  {emergencyDanger === false && (
                    <div className="space-y-4">
                      <div className="bg-[#D97A68]/10 rounded-xl p-3 mb-4">
                        <p className="text-sm text-[#2E2E2E]/80">
                          Fill out the form below and we'll respond as quickly as possible.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                          What symptoms are you seeing? *
                        </label>
                        <textarea
                          value={emergencySymptoms}
                          onChange={(e) => setEmergencySymptoms(e.target.value)}
                          placeholder="Describe what's happening..."
                          className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] resize-none min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#5A4A42] mb-2">When did this start? *</label>
                        <input
                          type="text"
                          value={emergencyWhen}
                          onChange={(e) => setEmergencyWhen(e.target.value)}
                          placeholder="e.g., 2 hours ago, this morning..."
                          className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEmergencyDanger(null)}
                          className="flex-1 inline-flex items-center justify-center rounded-xl border border-[#5A4A42] bg-white px-4 py-3 text-sm font-semibold text-[#5A4A42] hover:bg-[#F7E2BD]/40 transition"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSubmitEmergency}
                          disabled={submitting || !emergencySymptoms.trim() || !emergencyWhen.trim()}
                          className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#D97A68] px-4 py-3 text-sm font-semibold text-white hover:bg-[#D97A68]/90 transition disabled:opacity-50"
                        >
                          {submitting ? "Submitting..." : "Submit Emergency"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RequestHelpModal
