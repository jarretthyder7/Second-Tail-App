"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Phone, AlertCircle, Package, Calendar, CheckCircle2 } from "lucide-react"

export default function HelpRequestSettingsPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [orgId])

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
        body: JSON.stringify({
          orgId,
          stepId: "help_settings",
          isCompleted: true,
        }),
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSupply = (supply: string) => {
    if (!settings) return
    const supplies = settings.allowed_supply_types || []
    if (supplies.includes(supply)) {
      setSettings({
        ...settings,
        allowed_supply_types: supplies.filter((s: string) => s !== supply),
      })
    } else {
      setSettings({
        ...settings,
        allowed_supply_types: [...supplies, supply],
      })
    }
  }

  const toggleAppointmentType = (type: string) => {
    if (!settings) return
    const types = settings.allowed_appointment_types || []
    if (types.includes(type)) {
      setSettings({
        ...settings,
        allowed_appointment_types: types.filter((t: string) => t !== type),
      })
    } else {
      setSettings({
        ...settings,
        allowed_appointment_types: [...types, type],
      })
    }
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

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
      <div className="space-y-8">
        {/* Header with setup badge */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#5A4A42] mb-2">Foster Support Settings</h1>
            <p className="text-[#2E2E2E]/70">Configure how foster parents can request help and support</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs font-semibold text-green-700">Setup Step</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
            <div className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5">✓</div>
            <p className="text-sm text-green-800">Settings saved successfully</p>
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
                <p className="text-xs text-[#2E2E2E]/60 mt-1">
                  Number displayed when fosters click "Call Team" for general support
                </p>
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

            {/* Supply Types */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-[#D76B1A]" />
                <h2 className="text-2xl font-bold text-[#5A4A42]">Available Supplies</h2>
              </div>

              <p className="text-sm text-[#2E2E2E]/70 mb-4">
                Select which supplies fosters can request from your organization
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {["Food", "Pee Pads", "Crate", "Toys", "Leash", "Medications", "Other"].map((supply) => (
                  <label
                    key={supply}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#F7E2BD] cursor-pointer hover:bg-[#F7E2BD]/20"
                  >
                    <input
                      type="checkbox"
                      checked={(settings.allowed_supply_types || []).includes(supply)}
                      onChange={() => toggleSupply(supply)}
                      className="w-4 h-4 text-[#D76B1A] rounded focus:ring-[#D76B1A]"
                    />
                    <span className="text-sm text-[#5A4A42]">{supply}</span>
                  </label>
                ))}
              </div>

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

            {/* Appointment Types */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-[#D76B1A]" />
                <h2 className="text-2xl font-bold text-[#5A4A42]">Appointment Types</h2>
              </div>

              <p className="text-sm text-[#2E2E2E]/70 mb-4">Select which appointment types fosters can schedule</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {["Vet Visit", "Checkup", "Vaccination", "Dental", "Emergency"].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#F7E2BD] cursor-pointer hover:bg-[#F7E2BD]/20"
                  >
                    <input
                      type="checkbox"
                      checked={(settings.allowed_appointment_types || []).includes(type)}
                      onChange={() => toggleAppointmentType(type)}
                      className="w-4 h-4 text-[#D76B1A] rounded focus:ring-[#D76B1A]"
                    />
                    <span className="text-sm text-[#5A4A42]">{type}</span>
                  </label>
                ))}
              </div>

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

            {/* Save Button */}
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
