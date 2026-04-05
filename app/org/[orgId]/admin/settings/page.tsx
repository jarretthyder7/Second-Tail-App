"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { createClient } from "@/lib/supabase/client"
import { HelpCircle, X, CheckCircle2, ArrowRight, LogOut, Calendar, Upload, BookOpen, AlertCircle, Pause, Trash2, Bell } from "lucide-react"

// Inline SVG icon
const SaveIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
    />
  </svg>
)

type Organization = {
  id: string
  name: string
  email: string
  phone: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  created_at: string
  updated_at: string
  branding?: {
    primary_color: string
    accent_color: string
    logo_url: string | null
  }
  notification_preferences?: {
    new_message_from_foster: boolean
    foster_appointment_request: boolean
    foster_supply_request: boolean
    foster_reimbursement_request: boolean
  }
}

export default function OrgSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <OrgSettingsContent />
    </ProtectedRoute>
  )
}

function OrgSettingsContent() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const [org, setOrg] = useState<Organization | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [submittingTicket, setSubmittingTicket] = useState(false)
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [notificationPrefs, setNotificationPrefs] = useState({
    new_message_from_foster: true,
    foster_appointment_request: true,
    foster_supply_request: true,
    foster_reimbursement_request: true,
  })

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient()
      const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId).single()

      if (error) {
        console.error("[v0] Error loading organization:", error)
        setError("Failed to load organization")
        return
      }

      setOrg(data)

      // Load notification preferences if they exist
      if (data.notification_preferences) {
        setNotificationPrefs({
          new_message_from_foster: data.notification_preferences.new_message_from_foster ?? true,
          foster_appointment_request: data.notification_preferences.foster_appointment_request ?? true,
          foster_supply_request: data.notification_preferences.foster_supply_request ?? true,
          foster_reimbursement_request: data.notification_preferences.foster_reimbursement_request ?? true,
        })
      }
    }
    loadOrg()

    // Auto-open support modal if support=true in URL
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("support") === "true") {
      setShowSupportModal(true)
      // Clear the URL param after opening
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [orgId])

  const handleSave = async () => {
    if (!org) return
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    console.log("[v0] Attempting to save organization:", {
      orgId,
      name: org.name,
      email: org.email,
    })

    const supabase = createClient()
    const { data, error } = await supabase
      .from("organizations")
      .update({
        name: org.name,
        email: org.email,
        phone: org.phone,
        address: org.address,
        city: org.city,
        state: org.state,
        zip: org.zip,
        branding: org.branding,
        notification_preferences: notificationPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId)
      .select()

    if (error) {
      console.error("[v0] Error saving organization:", error)
      setError(`Failed to save changes: ${error.message}`)
      setIsSaving(false)
      return
    }

    console.log("[v0] Organization saved successfully:", data)
    setSuccessMessage("Changes saved successfully!")

    try {
      await fetch(`/api/admin/setup-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          stepId: "org_profile",
          isCompleted: true,
        }),
      })
      window.dispatchEvent(new CustomEvent("setup-step-completed", { detail: { stepId: "org_profile" } }))
    } catch (error) {
      console.error("[v0] Error marking setup step complete:", error)
    }

    setIsSaving(false)

    // Refresh the page data
    router.refresh()

    // Notify other components
    window.dispatchEvent(new CustomEvent("organization-updated", { detail: { orgId } }))

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleSubmitTicket = async (formData: FormData) => {
    setSubmittingTicket(true)
    try {
      const response = await fetch("/api/admin/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          subject: formData.get("subject"),
          message: formData.get("message"),
          category: formData.get("category"),
        }),
      })

      if (!response.ok) throw new Error("Failed to submit ticket")
      setTicketSubmitted(true)
      setTimeout(() => {
        setShowSupportModal(false)
        setTicketSubmitted(false)
      }, 2000)
    } catch (error) {
      console.error("[v0] Error submitting ticket:", error)
      alert("Failed to submit support ticket. Please try again.")
    } finally {
      setSubmittingTicket(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo must be smaller than 5MB")
      return
    }

    setIsUploadingLogo(true)
    setError(null)

    try {
      // Upload to Vercel Blob
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload logo")
      }

      const { url } = await response.json()

      // Update organization with new logo URL
      setOrg({
        ...org!,
        branding: { ...org?.branding, logo_url: url },
      })

      setSuccessMessage("Logo uploaded successfully! Click Save Branding to confirm.")
    } catch (err) {
      console.error("[v0] Error uploading logo:", err)
      setError("Failed to upload logo. Please try again.")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setOrg({
      ...org!,
      branding: { ...org?.branding, logo_url: null },
    })
    setSuccessMessage("Logo removed. Click Save Branding to confirm.")
  }

  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    async function loadCurrentUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setCurrentUser(profile)
      }
    }
    loadCurrentUser()
  }, [])

  const handlePauseOrganization = async (months: number) => {
    setIsSaving(true)
    const supabase = createClient()

    // Check if user is org_admin (only org admins can pause)
    if (currentUser?.org_role !== "org_admin") {
      setError("Only organization administrators can pause the organization")
      setIsSaving(false)
      return
    }

    const pauseUntil = new Date()
    pauseUntil.setMonth(pauseUntil.getMonth() + months)

    const { error } = await supabase
      .from("organizations")
      .update({
        paused_at: new Date().toISOString(),
        paused_until: pauseUntil.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId)

    if (error) {
      setError("Failed to pause organization")
      console.error("[v0] Error pausing organization:", error)
    } else {
      // Send email notification to all org admins
      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "org-paused",
            email: org?.email,
            orgName: org?.name,
            pausedBy: currentUser?.name,
            pausedUntil: pauseUntil.toDateString(),
            months,
          }),
        })
      } catch (err) {
        console.error("[v0] Error sending pause notification email:", err)
      }

      setSuccessMessage(`Organization paused until ${pauseUntil.toDateString()}. Admin notifications sent.`)
      setShowPauseModal(false)
      router.refresh()
    }
    setIsSaving(false)
  }

  const handleCloseOrganization = async () => {
    setIsSaving(true)
    const supabase = createClient()

    // Check if user is org_admin (only org admins can close)
    if (currentUser?.org_role !== "org_admin") {
      setError("Only organization administrators can close the organization")
      setIsSaving(false)
      return
    }

    const { error } = await supabase
      .from("organizations")
      .update({
        closed_at: new Date().toISOString(),
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId)

    if (error) {
      setError("Failed to close organization")
      console.error("[v0] Error closing organization:", error)
    } else {
      // Send email notification to all org admins
      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "org-closed",
            email: org?.email,
            orgName: org?.name,
            closedBy: currentUser?.name,
          }),
        })
      } catch (err) {
        console.error("[v0] Error sending close notification email:", err)
      }

      setSuccessMessage("Organization closed. All notifications have been sent. Redirecting...")
      setShowCloseModal(false)
      setTimeout(() => {
        router.push("/")
      }, 2000)
    }
    setIsSaving(false)
  }

  const handleCloseAccount = async () => {
    setIsSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      setError("Failed to close account")
    } else {
      setSuccessMessage("Account closed. Redirecting...")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }
    setIsSaving(false)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">{error}</div>
      </div>
    )
  }

  if (!org) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#5A4A42] mb-1">Organization Settings</h1>
        <p className="text-sm text-[#2E2E2E]/70">Manage your organization details</p>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#5A4A42] mb-2">Organization Name</label>
          <input
            type="text"
            value={org.name}
            onChange={(e) => setOrg({ ...org, name: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5A4A42] mb-2">Contact Email</label>
          <input
            type="email"
            value={org.email}
            onChange={(e) => setOrg({ ...org, email: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5A4A42] mb-2">Contact Phone</label>
          <input
            type="tel"
            value={org.phone || ""}
            onChange={(e) => setOrg({ ...org, phone: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5A4A42] mb-2">Address</label>
          <textarea
            value={org.address || ""}
            onChange={(e) => setOrg({ ...org, address: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-2">City</label>
            <input
              type="text"
              value={org.city || ""}
              onChange={(e) => setOrg({ ...org, city: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-2">State</label>
            <input
              type="text"
              value={org.state || ""}
              onChange={(e) => setOrg({ ...org, state: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-2">ZIP Code</label>
            <input
              type="text"
              value={org.zip || ""}
              onChange={(e) => setOrg({ ...org, zip: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#D76B1A] text-white text-sm font-semibold hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
        >
          <SaveIcon className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#5A4A42] mb-4">Appointment Settings</h2>
        <button
          onClick={() => router.push(`/org/${orgId}/admin/settings/appointment-types`)}
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-[#5A4A42] hover:bg-[#FBF8F4] border-2 border-[#F7E2BD] transition group"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#D76B1A]" />
            <div className="text-left">
              <div className="font-semibold">Manage Appointment Types</div>
              <div className="text-xs text-[#2E2E2E]/70">Customize appointment categories, colors, and labels</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#D76B1A] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Foster Resources section */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#5A4A42] mb-4">Foster Resources</h2>
        <button
          onClick={() => router.push(`/org/${orgId}/admin/settings/foster-resources`)}
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-[#5A4A42] hover:bg-[#FBF8F4] border-2 border-[#F7E2BD] transition group"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#D76B1A]" />
            <div className="text-left">
              <div className="font-semibold">Manage Foster Resources</div>
              <div className="text-xs text-[#2E2E2E]/70">Add helpful links and guides for your foster families</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#D76B1A] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Notification Preferences section */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-[#D76B1A]" />
          <h2 className="text-lg font-semibold text-[#5A4A42]">Notification Preferences</h2>
        </div>
        <p className="text-sm text-[#2E2E2E]/70 mb-6">
          Control which email notifications you receive from foster activity.
        </p>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-xl border-2 border-[#F7E2BD] hover:bg-[#FBF8F4] cursor-pointer transition">
            <div>
              <div className="font-medium text-[#5A4A42]">New message from foster</div>
              <div className="text-xs text-[#2E2E2E]/70">Get notified when a foster sends you a message</div>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.new_message_from_foster}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, new_message_from_foster: e.target.checked })}
              className="w-5 h-5 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]/40"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl border-2 border-[#F7E2BD] hover:bg-[#FBF8F4] cursor-pointer transition">
            <div>
              <div className="font-medium text-[#5A4A42]">Foster appointment request</div>
              <div className="text-xs text-[#2E2E2E]/70">Get notified when a foster requests an appointment</div>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.foster_appointment_request}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, foster_appointment_request: e.target.checked })}
              className="w-5 h-5 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]/40"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl border-2 border-[#F7E2BD] hover:bg-[#FBF8F4] cursor-pointer transition">
            <div>
              <div className="font-medium text-[#5A4A42]">Foster supply request</div>
              <div className="text-xs text-[#2E2E2E]/70">Get notified when a foster requests supplies</div>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.foster_supply_request}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, foster_supply_request: e.target.checked })}
              className="w-5 h-5 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]/40"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl border-2 border-[#F7E2BD] hover:bg-[#FBF8F4] cursor-pointer transition">
            <div>
              <div className="font-medium text-[#5A4A42]">Foster reimbursement request</div>
              <div className="text-xs text-[#2E2E2E]/70">Get notified when a foster submits a reimbursement</div>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.foster_reimbursement_request}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, foster_reimbursement_request: e.target.checked })}
              className="w-5 h-5 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]/40"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-6 flex items-center gap-2 px-6 py-2 rounded-full bg-[#D76B1A] text-white text-sm font-semibold hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
        >
          <SaveIcon className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Notification Preferences"}
        </button>
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#5A4A42] mb-4">Rescue Branding</h2>
        <p className="text-sm text-[#2E2E2E]/70 mb-6">
          Customize how your rescue appears to fosters. Changes will appear on the foster dashboard immediately.
        </p>

        <div className="space-y-6">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-3">Primary Brand Color</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={org.branding?.primary_color || "#D76B1A"}
                onChange={(e) =>
                  setOrg({
                    ...org,
                    branding: { ...org.branding, primary_color: e.target.value },
                  })
                }
                className="w-16 h-16 rounded-lg cursor-pointer border-2 border-[#F7E2BD]"
              />
              <div className="flex-1">
                <div className="text-xs text-[#2E2E2E]/70 mb-2">
                  Current: {org.branding?.primary_color || "#D76B1A"}
                </div>
                <input
                  type="text"
                  value={org.branding?.primary_color || "#D76B1A"}
                  onChange={(e) =>
                    setOrg({
                      ...org,
                      branding: { ...org.branding, primary_color: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                />
              </div>
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-3">Accent Color</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={org.branding?.accent_color || "#F7E2BD"}
                onChange={(e) =>
                  setOrg({
                    ...org,
                    branding: { ...org.branding, accent_color: e.target.value },
                  })
                }
                className="w-16 h-16 rounded-lg cursor-pointer border-2 border-[#F7E2BD]"
              />
              <div className="flex-1">
                <div className="text-xs text-[#2E2E2E]/70 mb-2">Current: {org.branding?.accent_color || "#F7E2BD"}</div>
                <input
                  type="text"
                  value={org.branding?.accent_color || "#F7E2BD"}
                  onChange={(e) =>
                    setOrg({
                      ...org,
                      branding: { ...org.branding, accent_color: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                />
              </div>
            </div>
          </div>

          {/* Logo Preview */}
          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-3">Organization Logo</label>
            <div className="space-y-4">
              {org.branding?.logo_url && (
                <div className="relative w-24 h-24">
                  <img
                    src={org.branding.logo_url || "/placeholder.svg"}
                    alt="Logo preview"
                    className="w-full h-full rounded-lg object-cover border-2 border-[#F7E2BD]"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#F7E2BD] bg-white hover:bg-[#FBF8F4] cursor-pointer transition font-medium text-sm text-[#5A4A42]">
                  <Upload className="w-4 h-4" />
                  {isUploadingLogo ? "Uploading..." : "Choose Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-[#2E2E2E]/60">PNG, JPG or GIF (max 5MB)</span>
              </div>

              {org.branding?.logo_url && <p className="text-xs text-green-600">Logo is ready to save</p>}
            </div>
          </div>

          {/* Brand Preview */}
          <div className="mt-6 p-4 rounded-xl border-2 border-[#F7E2BD] bg-[#FBF8F4]">
            <p className="text-xs font-medium text-[#5A4A42] mb-3">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg"
                style={{ backgroundColor: org.branding?.primary_color || "#D76B1A" }}
              />
              <div>
                <div className="text-sm font-semibold text-[#5A4A42]">{org.name}</div>
                <div className="text-xs text-[#2E2E2E]/70">Your rescue branding</div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-6 flex items-center gap-2 px-6 py-2 rounded-full bg-[#D76B1A] text-white text-sm font-semibold hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
        >
          <SaveIcon className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Branding"}
        </button>
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#5A4A42] mb-4">Account</h2>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 border-2 border-red-100 transition"
        >
          <LogOut className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold">Logout</div>
            <div className="text-xs text-red-500/70">Sign out of your account</div>
          </div>
        </button>
      </div>

      <div className="mt-8 bg-[#FBF8F4] border-2 border-[#F7E2BD] rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <HelpCircle className="w-5 h-5 text-[#D76B1A]" />
          <h3 className="font-semibold text-[#5A4A42]">Need Further Assistance?</h3>
        </div>
        <p className="text-sm text-[#2E2E2E]/70 mb-4">
          If you have any questions about your settings or need help, our support team is here to assist.
        </p>
        <button
          onClick={() => setShowSupportModal(true)}
          className="inline-flex items-center gap-2 px-6 py-2 bg-[#D76B1A] text-white font-medium rounded-lg hover:bg-[#D76B1A]/90 transition"
        >
          Create Support Ticket
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Support Ticket Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#D76B1A] to-[#D76B1A]/80 text-white p-6 relative">
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold">Create Support Ticket</h2>
              <p className="text-white/90 text-sm mt-1">We'll respond to your request shortly</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {ticketSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-[#5A4A42] mb-2">Ticket Submitted!</h3>
                  <p className="text-sm text-[#2E2E2E]/70">Thank you for reaching out. We'll be in touch soon.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmitTicket(new FormData(e.currentTarget))
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">Category</label>
                    <select
                      name="category"
                      required
                      className="w-full px-4 py-2 border-2 border-[#F7E2BD] rounded-lg focus:border-[#D76B1A] focus:outline-none"
                    >
                      <option value="">Select a category</option>
                      <option value="Technical Issue">Technical Issue</option>
                      <option value="Setup Help">Setup Help</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      placeholder="Brief description of your issue"
                      className="w-full px-4 py-2 border-2 border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      placeholder="Please provide details about your request..."
                      className="w-full px-4 py-2 border-2 border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSupportModal(false)}
                      className="flex-1 px-4 py-2 border-2 border-[#D76B1A] text-[#D76B1A] font-medium rounded-lg hover:bg-[#FBF8F4] transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingTicket}
                      className="flex-1 px-4 py-2 bg-[#D76B1A] text-white font-medium rounded-lg hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
                    >
                      {submittingTicket ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-red-900">Danger Zone</h3>
        </div>
        
        <div className="space-y-3">
          {/* Pause Organization */}
          <button
            onClick={() => setShowPauseModal(true)}
            className="flex items-center gap-3 p-4 w-full rounded-lg border-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition text-left"
          >
            <Pause className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-yellow-900">Pause Your Organization</div>
              <div className="text-xs text-yellow-700">Temporarily suspend operations for up to 3 months</div>
            </div>
          </button>

          {/* Close Organization */}
          <button
            onClick={() => setShowCloseModal(true)}
            className="flex items-center gap-3 p-4 w-full rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 transition text-left"
          >
            <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-900">Close Organization</div>
              <div className="text-xs text-red-700">Permanently close your rescue organization</div>
            </div>
          </button>
        </div>
      </div>

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-yellow-50 border-b border-yellow-200 p-6">
              <h2 className="text-xl font-bold text-yellow-900">Pause Organization</h2>
              <p className="text-sm text-yellow-800 mt-1">Temporarily suspend your operations</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#2E2E2E]">Select how long you'd like to pause:</p>
              <div className="space-y-2">
                {[1, 2, 3].map((months) => (
                  <button
                    key={months}
                    onClick={() => handlePauseOrganization(months)}
                    disabled={isSaving}
                    className="w-full px-4 py-2 border-2 border-yellow-200 text-yellow-900 font-medium rounded-lg hover:bg-yellow-50 transition disabled:opacity-50"
                  >
                    {months} Month{months > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPauseModal(false)}
                className="w-full px-4 py-2 bg-[#D76B1A] text-white font-medium rounded-lg hover:bg-[#D76B1A]/90 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-red-50 border-b border-red-200 p-6">
              <h2 className="text-xl font-bold text-red-900">Close Organization</h2>
              <p className="text-sm text-red-800 mt-1">This action cannot be undone</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#2E2E2E]">
                Are you sure you want to permanently close your organization? All data will be retained but the organization will be inactive.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseOrganization}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isSaving ? "Closing..." : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
