"use client"

import { useParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Phone, AlertCircle, Package, Calendar, CheckCircle2, Plus, X, GripVertical, DollarSign } from "lucide-react"
import {
  DAY_KEYS,
  DAY_LABELS,
  DEFAULT_HOURS_OF_OPERATION,
  normalizeHours,
  type DayKey,
  type HoursOfOperation,
} from "@/lib/hours-of-operation"

const PRESET_SUPPLIES = ["Food", "Pee Pads", "Crate", "Toys", "Leash", "Medications", "Other"]
const PRESET_APPOINTMENTS = ["Vet Visit", "Checkup", "Vaccination", "Dental", "Emergency", "Behavioral Consult", "Training", "Grooming"]

export default function HelpRequestSettingsPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [newSupply, setNewSupply] = useState("")
  const [newAppointment, setNewAppointment] = useState("")
  const newSupplyInputRef = useRef<HTMLInputElement>(null)
  const newAppointmentInputRef = useRef<HTMLInputElement>(null)
  // Tracks whether the corresponding onboarding step is done — drives the "Setup Step"
  // badge in the header so it disappears once the user has finished onboarding.
  const [isHelpSettingsStepComplete, setIsHelpSettingsStepComplete] = useState(true)

  useEffect(() => {
    fetchSettings()
    fetchSetupStatus()
  }, [orgId])

  const fetchSetupStatus = async () => {
    try {
      const res = await fetch(`/api/admin/setup-status?orgId=${orgId}`)
      if (!res.ok) return
      const data = await res.json()
      const completed: string[] = (data?.completedSteps || data?.steps || []).map((s: any) =>
        typeof s === "string" ? s : s.setup_step_id || s.id,
      )
      setIsHelpSettingsStepComplete(completed.includes("help_settings"))
    } catch {
      // Best-effort — if it fails, default to hiding the badge (assume complete) so we
      // don't show a "Setup Step" tag forever to existing users.
      setIsHelpSettingsStepComplete(true)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/admin/help-settings?orgId=${orgId}`)
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      setSettings(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/admin/help-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, ...settings }),
      })

      if (!response.ok) throw new Error("Failed to save settings")

      await fetch(`/api/admin/setup-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, stepId: "help_settings", isCompleted: true }),
      })
      window.dispatchEvent(new CustomEvent("setup-step-completed", { detail: { stepId: "help_settings" } }))

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const addSupply = () => {
    const trimmed = newSupply.trim()
    if (!trimmed || !settings) return
    const current: string[] = settings.allowed_supply_types || []
    if (current.map((s: string) => s.toLowerCase()).includes(trimmed.toLowerCase())) return
    setSettings({ ...settings, allowed_supply_types: [...current, trimmed] })
    setNewSupply("")
    newSupplyInputRef.current?.focus()
  }

  const removeSupply = (supply: string) => {
    if (!settings) return
    setSettings({
      ...settings,
      allowed_supply_types: (settings.allowed_supply_types || []).filter((s: string) => s !== supply),
    })
  }

  const addAppointmentType = () => {
    const trimmed = newAppointment.trim()
    if (!trimmed || !settings) return
    const current: string[] = settings.allowed_appointment_types || []
    if (current.map((s: string) => s.toLowerCase()).includes(trimmed.toLowerCase())) return
    setSettings({ ...settings, allowed_appointment_types: [...current, trimmed] })
    setNewAppointment("")
    newAppointmentInputRef.current?.focus()
  }

  const removeAppointmentType = (type: string) => {
    if (!settings) return
    setSettings({
      ...settings,
      allowed_appointment_types: (settings.allowed_appointment_types || []).filter((t: string) => t !== type),
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#D76B1A] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#5A4A42] text-sm">Loading settings...</p>
        </div>
      </div>
    )
  }

  const currentSupplies: string[] = settings?.allowed_supply_types || []

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#5A4A42] mb-2">Foster Support Settings</h1>
            <p className="text-[#2E2E2E]/70">Configure how foster parents can request help and support</p>
          </div>
          {!isHelpSettingsStepComplete && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200"
              title="This page is part of your one-time setup"
            >
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-green-700">Setup Step</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">Settings saved — fosters will see the updated list immediately.</p>
          </div>
        )}

        {settings && (
          <div className="space-y-8">
            {/* Phone Numbers */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-6 h-6 text-[#D76B1A]" />
                <h2 className="text-2xl font-bold text-[#5A4A42]">Contact Numbers</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Foster Support Phone</label>
                <input
                  type="tel"
                  value={settings.contact_phone || ""}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                />
                <p className="text-xs text-[#2E2E2E]/60 mt-1">Number displayed when fosters click "Call Team" for general support</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Emergency Line Phone</label>
                <input
                  type="tel"
                  value={settings.emergency_phone || ""}
                  onChange={(e) => setSettings({ ...settings, emergency_phone: e.target.value })}
                  placeholder="(555) 911-HELP"
                  className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                />
                <p className="text-xs text-[#2E2E2E]/60 mt-1">Number displayed for life-threatening emergencies only</p>
              </div>
            </div>

            {/* Supply Types — fully editable */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-[#D76B1A]" />
                  <div>
                    <h2 className="text-2xl font-bold text-[#5A4A42]">Available Supplies</h2>
                    <p className="text-sm text-[#2E2E2E]/70 mt-0.5">
                      Fosters will see exactly this list when submitting a supply request.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F7E2BD] text-[#5A4A42]">
                  {currentSupplies.length} items
                </span>
              </div>

              {/* Quick-add preset items not yet in list */}
              {PRESET_SUPPLIES.filter((s) => !currentSupplies.includes(s)).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#2E2E2E]/60 mb-2 uppercase tracking-wide">Quick add</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SUPPLIES.filter((s) => !currentSupplies.includes(s)).map((supply) => (
                      <button
                        key={supply}
                        type="button"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            allowed_supply_types: [...currentSupplies, supply],
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#D76B1A]/40 text-sm text-[#D76B1A] hover:bg-[#D76B1A]/5 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {supply}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current supply list */}
              {currentSupplies.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#2E2E2E]/60 uppercase tracking-wide">Current list</p>
                  {currentSupplies.map((supply) => (
                    <div
                      key={supply}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#F7E2BD] bg-[#FBF8F4] group"
                    >
                      <GripVertical className="w-4 h-4 text-[#2E2E2E]/20 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-[#5A4A42]">{supply}</span>
                      <button
                        type="button"
                        onClick={() => removeSupply(supply)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-[#2E2E2E]/40 hover:text-red-500 transition-all"
                        aria-label={`Remove ${supply}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 rounded-xl border-2 border-dashed border-[#F7E2BD]">
                  <Package className="w-8 h-8 text-[#2E2E2E]/20 mx-auto mb-2" />
                  <p className="text-sm text-[#2E2E2E]/50">No supplies added yet. Use quick add or type a custom item below.</p>
                </div>
              )}

              {/* Add custom item */}
              <div>
                <p className="text-xs font-medium text-[#2E2E2E]/60 mb-2 uppercase tracking-wide">Add custom item</p>
                <div className="flex gap-2">
                  <input
                    ref={newSupplyInputRef}
                    type="text"
                    value={newSupply}
                    onChange={(e) => setNewSupply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addSupply() }
                    }}
                    placeholder="e.g. Flea Treatment, Harness..."
                    className="flex-1 px-4 py-2 rounded-xl border border-[#F7E2BD] text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
                  />
                  <button
                    type="button"
                    onClick={addSupply}
                    disabled={!newSupply.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D76B1A] text-white text-sm font-semibold hover:bg-[#D76B1A]/90 transition disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Enable toggle */}
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#F7E2BD] cursor-pointer hover:bg-[#F7E2BD]/20">
                <input
                  type="checkbox"
                  checked={settings.supplies_request_enabled || false}
                  onChange={(e) => setSettings({ ...settings, supplies_request_enabled: e.target.checked })}
                  className="w-4 h-4 text-[#D76B1A] rounded focus:ring-[#D76B1A]"
                />
                <span className="font-medium text-[#5A4A42]">Enable supply requests</span>
              </label>
            </div>

            {/* Appointment Types — fully editable */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-[#D76B1A]" />
                  <div>
                    <h2 className="text-2xl font-bold text-[#5A4A42]">Appointment Types</h2>
                    <p className="text-sm text-[#2E2E2E]/70 mt-0.5">
                      Fosters will see exactly this list when requesting appointments.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F7E2BD] text-[#5A4A42]">
                  {(settings.allowed_appointment_types || []).length} types
                </span>
              </div>

              {/* Quick-add preset items not yet in list */}
              {PRESET_APPOINTMENTS.filter((s) => !(settings.allowed_appointment_types || []).includes(s)).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#2E2E2E]/60 mb-2 uppercase tracking-wide">Quick add</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_APPOINTMENTS.filter((s) => !(settings.allowed_appointment_types || []).includes(s)).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            allowed_appointment_types: [...(settings.allowed_appointment_types || []), type],
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#D76B1A]/40 text-sm text-[#D76B1A] hover:bg-[#D76B1A]/5 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current appointment type list */}
              {(settings.allowed_appointment_types || []).length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#2E2E2E]/60 uppercase tracking-wide">Current list</p>
                  {(settings.allowed_appointment_types || []).map((type: string) => (
                    <div
                      key={type}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#F7E2BD] bg-[#FBF8F4] group"
                    >
                      <GripVertical className="w-4 h-4 text-[#2E2E2E]/20 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-[#5A4A42]">{type}</span>
                      <button
                        type="button"
                        onClick={() => removeAppointmentType(type)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-[#2E2E2E]/40 hover:text-red-500 transition-all"
                        aria-label={`Remove ${type}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 rounded-xl border-2 border-dashed border-[#F7E2BD]">
                  <Calendar className="w-8 h-8 text-[#2E2E2E]/20 mx-auto mb-2" />
                  <p className="text-sm text-[#2E2E2E]/50">No appointment types added yet. Use quick add or type a custom type below.</p>
                </div>
              )}

              {/* Add custom appointment type */}
              <div>
                <p className="text-xs font-medium text-[#2E2E2E]/60 mb-2 uppercase tracking-wide">Add custom type</p>
                <div className="flex gap-2">
                  <input
                    ref={newAppointmentInputRef}
                    type="text"
                    value={newAppointment}
                    onChange={(e) => setNewAppointment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addAppointmentType() }
                    }}
                    placeholder="e.g. Spay/Neuter, Microchip..."
                    className="flex-1 px-4 py-2 rounded-xl border border-[#F7E2BD] text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
                  />
                  <button
                    type="button"
                    onClick={addAppointmentType}
                    disabled={!newAppointment.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D76B1A] text-white text-sm font-semibold hover:bg-[#D76B1A]/90 transition disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Enable toggle */}
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#F7E2BD] cursor-pointer hover:bg-[#F7E2BD]/20">
                <input
                  type="checkbox"
                  checked={settings.appointment_booking_enabled || false}
                  onChange={(e) => setSettings({ ...settings, appointment_booking_enabled: e.target.checked })}
                  className="w-4 h-4 text-[#D76B1A] rounded focus:ring-[#D76B1A]"
                />
                <span className="font-medium text-[#5A4A42]">Enable appointment requests</span>
              </label>
            </div>

            {/* Reimbursements */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-[#D76B1A]" />
                <div>
                  <h2 className="text-2xl font-bold text-[#5A4A42]">Reimbursements</h2>
                  <p className="text-sm text-[#2E2E2E]/70 mt-0.5">
                    Let fosters submit out-of-pocket expenses for reimbursement.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#F7E2BD] cursor-pointer hover:bg-[#F7E2BD]/20">
                <input
                  type="checkbox"
                  checked={settings.reimbursements_enabled !== false}
                  onChange={(e) => setSettings({ ...settings, reimbursements_enabled: e.target.checked })}
                  className="w-4 h-4 text-[#D76B1A] rounded focus:ring-[#D76B1A]"
                />
                <span className="font-medium text-[#5A4A42]">Enable reimbursements for all fosters</span>
              </label>
              <p className="text-xs text-[#2E2E2E]/60">
                When off, the Reimbursements tab is hidden for every foster in your org. You can still enable it for
                specific fosters from their profile.
              </p>
            </div>

            {/* Hours of Operation */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-[#D76B1A]" />
                <h2 className="text-2xl font-bold text-[#5A4A42]">Hours of Operation</h2>
              </div>
              <p className="text-sm text-[#2E2E2E]/60 -mt-2">
                Fosters see these hours when they access emergency support. Toggle Closed for any day you're not
                available.
              </p>

              {(() => {
                // Local handle to keep the JSX below readable. normalizeHours coerces null /
                // legacy strings / partial objects into a usable shape.
                const hours: HoursOfOperation = normalizeHours(settings.hours_of_operation)

                const updateDay = (day: DayKey, patch: Partial<HoursOfOperation[DayKey]>) => {
                  setSettings({
                    ...settings,
                    hours_of_operation: {
                      ...hours,
                      [day]: { ...hours[day], ...patch },
                    },
                  })
                }

                const applyToWeekdays = () => {
                  // Copy Monday's open/close to Tue–Fri (and uncloses them) — common rescue pattern
                  const mon = hours.monday
                  if (mon.closed || !mon.open || !mon.close) return
                  const next = { ...hours }
                  ;(["tuesday", "wednesday", "thursday", "friday"] as const).forEach((d) => {
                    next[d] = { open: mon.open, close: mon.close, closed: false }
                  })
                  setSettings({ ...settings, hours_of_operation: next })
                }

                const resetToDefault = () => {
                  setSettings({ ...settings, hours_of_operation: { ...DEFAULT_HOURS_OF_OPERATION } })
                }

                return (
                  <div>
                    <div className="space-y-2">
                      {DAY_KEYS.map((day) => {
                        const d = hours[day]
                        return (
                          <div
                            key={day}
                            className={`flex flex-wrap items-center gap-3 p-3 rounded-xl border ${
                              d.closed
                                ? "bg-[#FBF8F4]/50 border-[#F7E2BD]/60"
                                : "bg-white border-[#F7E2BD]"
                            }`}
                          >
                            <div className="w-24 text-sm font-medium text-[#5A4A42]">{DAY_LABELS[day]}</div>

                            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                              <input
                                type="time"
                                value={d.open || ""}
                                disabled={d.closed}
                                onChange={(e) => updateDay(day, { open: e.target.value || null })}
                                className="px-3 py-1.5 rounded-lg border border-[#F7E2BD] text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <span className="text-sm text-[#5A4A42]/60">to</span>
                              <input
                                type="time"
                                value={d.close || ""}
                                disabled={d.closed}
                                onChange={(e) => updateDay(day, { close: e.target.value || null })}
                                className="px-3 py-1.5 rounded-lg border border-[#F7E2BD] text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-[#5A4A42] cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={d.closed}
                                onChange={(e) =>
                                  updateDay(day, {
                                    closed: e.target.checked,
                                    // When marking closed, don't lose existing open/close — they'll
                                    // come back if they uncheck. When reopening from closed, fall
                                    // back to default 9-5 if open/close were null.
                                    ...(e.target.checked
                                      ? {}
                                      : {
                                          open: d.open || "09:00",
                                          close: d.close || "17:00",
                                        }),
                                  })
                                }
                                className="w-4 h-4 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A] cursor-pointer"
                              />
                              Closed
                            </label>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#F7E2BD]">
                      <button
                        type="button"
                        onClick={applyToWeekdays}
                        disabled={hours.monday.closed || !hours.monday.open || !hours.monday.close}
                        className="text-xs font-medium text-[#D76B1A] hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                        title="Copy Monday's hours to Tuesday–Friday"
                      >
                        Apply Monday's hours to weekdays
                      </button>
                      <span className="text-[#5A4A42]/30 text-xs">|</span>
                      <button
                        type="button"
                        onClick={resetToDefault}
                        className="text-xs font-medium text-[#5A4A42]/70 hover:text-[#5A4A42] hover:underline"
                      >
                        Reset to default
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Emergency Support */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold text-[#5A4A42]">Emergency Support</h2>
              </div>

              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#F7E2BD] cursor-pointer hover:bg-[#F7E2BD]/20">
                <input
                  type="checkbox"
                  checked={settings.emergency_support_enabled || false}
                  onChange={(e) => setSettings({ ...settings, emergency_support_enabled: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-600"
                />
                <span className="font-medium text-[#5A4A42]">Enable emergency support requests</span>
              </label>
            </div>

            {/* Save */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
