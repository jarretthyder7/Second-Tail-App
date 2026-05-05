"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { createClient } from "@/lib/supabase/client"
import { HelpCircle, X, CheckCircle2, ArrowRight, LogOut, Calendar, Upload, BookOpen, AlertCircle, Pause, Trash2, Bell, Package, DollarSign } from "lucide-react"
import { PushNotificationToggle } from "@/components/foster/push-notification-toggle"

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

// Two-column (email | push) toggle row used inside admin Notification
// Preferences. Saves immediately on toggle.
function AdminPrefRow({
  label,
  helper,
  email,
  push,
  disabled,
  onChange,
}: {
  label: string
  helper: string
  email: boolean
  push: boolean
  disabled?: boolean
  onChange: (channel: "email" | "push", value: boolean) => void
}) {
  return (
    <div className={`p-4 rounded-xl border-2 border-[#F7E2BD] transition ${disabled ? "opacity-70" : "hover:bg-[#FBF8F4]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="pr-3 flex-1 min-w-0">
          <div className="font-medium text-[#5A4A42]">{label}</div>
          <div className="text-xs text-[#2E2E2E]/70 mt-0.5">{helper}</div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 pt-0.5">
          <label className="flex flex-col items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={email}
              disabled={disabled}
              onChange={(e) => onChange("email", e.target.checked)}
              className="w-5 h-5 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]/40"
            />
            <span className="text-[10px] text-[#2E2E2E]/60">Email</span>
          </label>
          <label className="flex flex-col items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={push}
              disabled={disabled}
              onChange={(e) => onChange("push", e.target.checked)}
              className="w-5 h-5 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]/40"
            />
            <span className="text-[10px] text-[#2E2E2E]/60">Push</span>
          </label>
        </div>
      </div>
    </div>
  )
}

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
  // Per-user prefs with separate email + push toggles. Each rescue staff
  // member controls their own; push subscription on the device must also
  // be enabled (see PushNotificationToggle row above).
  type ChannelPrefs = { email: boolean; push: boolean }
  const [notificationPrefs, setNotificationPrefs] = useState<{
    messages: ChannelPrefs
    appointment_requests: ChannelPrefs
    supply_requests: ChannelPrefs
    reimbursement_requests: ChannelPrefs
    foster_log_updates: ChannelPrefs
  }>({
    messages: { email: true, push: true },
    appointment_requests: { email: true, push: true },
    supply_requests: { email: true, push: true },
    reimbursement_requests: { email: true, push: true },
    foster_log_updates: { email: true, push: true },
  })
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsSavedAt, setPrefsSavedAt] = useState<number | null>(null)

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient()
      const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId).single()

      if (error) {
        console.error("Error loading organization:", error)
        setError("Failed to load organization")
        return
      }

      setOrg(data)

      // Load this user's per-user prefs from their profile. Two stored
      // shapes are supported on read so we can transition smoothly:
      //   - boolean (legacy single-toggle for email): treat as { email: v, push: true }
      //   - { email, push } (current): use as-is
      // Falls back to the legacy org-wide prefs if no per-user value is set.
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("notification_preferences")
          .eq("id", user.id)
          .maybeSingle()
        const personal = profileRow?.notification_preferences || {}
        const orgPrefs = data.notification_preferences || {}
        const lift = (
          personalKey: keyof typeof personal,
          orgKey: string,
        ): ChannelPrefs => {
          const v = personal[personalKey]
          if (typeof v === "object" && v !== null) {
            return { email: v.email !== false, push: v.push !== false }
          }
          if (typeof v === "boolean") return { email: v, push: true }
          // Org-wide legacy fallback only gates email; push defaults on.
          if (orgKey in orgPrefs) return { email: orgPrefs[orgKey] !== false, push: true }
          return { email: true, push: true }
        }
        setNotificationPrefs({
          messages: lift("messages", "new_message_from_foster"),
          appointment_requests: lift("appointment_requests", "foster_appointment_request"),
          supply_requests: lift("supply_requests", "foster_supply_request"),
          reimbursement_requests: lift("reimbursement_requests", "foster_reimbursement_request"),
          foster_log_updates: lift("foster_log_updates", ""),
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

    console.log("Attempting to save organization:", {
      orgId,
      name: org.name,
      email: org.email,
    })

    const supabase = createClient()
    // Notification prefs now live per-user on profiles, not on the org row.
    // The Save button below this only persists org info; the prefs section
    // saves itself on toggle (see saveNotificationPrefs).
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId)
      .select()

    if (error) {
      console.error("Error saving organization:", error)
      setError(`Failed to save changes: ${error.message}`)
      setIsSaving(false)
      return
    }

    console.log("Organization saved successfully:", data)
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
      console.error("Error marking setup step complete:", error)
    }

    setIsSaving(false)

    // Refresh the page data
    router.refresh()

    // Notify other components
    window.dispatchEvent(new CustomEvent("organization-updated", { detail: { orgId } }))

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Persist a single pref change to the current user's profile. Called as
  // soon as a toggle flips so admins don't need a Save button — matches the
  // pattern used by the Push toggle.
  async function saveNotificationPrefs(next: typeof notificationPrefs) {
    setSavingPrefs(true)
    setNotificationPrefs(next)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      await supabase
        .from("profiles")
        .update({ notification_preferences: next, updated_at: new Date().toISOString() })
        .eq("id", user.id)
      setPrefsSavedAt(Date.now())
      setTimeout(() => setPrefsSavedAt(null), 2000)
    } catch (err) {
      console.error("Failed to save notification preferences:", err)
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleSubmitTicket = async (formData: FormData) => {
    setSubmittingTicket(true)
    try {
      formData.append("orgId", orgId)

      // Client-side size guard so the user gets an immediate, clear error
      // instead of a slow upload that the server then rejects.
      const MAX_TOTAL_BYTES = 25 * 1024 * 1024
      const files = formData
        .getAll("attachments")
        .filter((f): f is File => f instanceof File && f.size > 0)
      const totalBytes = files.reduce((acc, f) => acc + f.size, 0)
      if (totalBytes > MAX_TOTAL_BYTES) {
        alert(
          `Attachments are too large (${(totalBytes / 1024 / 1024).toFixed(1)}MB). Max ${
            MAX_TOTAL_BYTES / 1024 / 1024
          }MB total.`,
        )
        setSubmittingTicket(false)
        return
      }

      // Don't set Content-Type — let the browser set the multipart boundary.
      const response = await fetch("/api/admin/support-tickets", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to submit ticket")
      setTicketSubmitted(true)
      setTimeout(() => {
        setShowSupportModal(false)
        setTicketSubmitted(false)
      }, 2000)
    } catch (error) {
      console.error("Error submitting ticket:", error)
      alert("Failed to submit support ticket. Please try again.")
    } finally {
      setSubmittingTicket(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login/rescue")
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
      console.error("Error uploading logo:", err)
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
      console.error("Error pausing organization:", error)
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
        console.error("Error sending pause notification email:", err)
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
      console.error("Error closing organization:", error)
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
        console.error("Error sending close notification email:", err)
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
        router.push("/login/rescue")
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
        <h2 className="text-lg font-semibold text-[#5A4A42] mb-4">Foster Support Settings</h2>
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/org/${orgId}/admin/settings/help-requests`)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-[#5A4A42] hover:bg-[#FBF8F4] border-2 border-[#F7E2BD] transition group"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-[#D76B1A]" />
              <div className="text-left">
                <div className="font-semibold">Supply Request Types</div>
                <div className="text-xs text-[#2E2E2E]/70">Add or remove items fosters can request</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#D76B1A] group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => router.push(`/org/${orgId}/admin/settings/help-requests`)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-[#5A4A42] hover:bg-[#FBF8F4] border-2 border-[#F7E2BD] transition group"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#D76B1A]" />
              <div className="text-left">
                <div className="font-semibold">Appointment Request Types</div>
                <div className="text-xs text-[#2E2E2E]/70">Add or remove appointment types fosters can request</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#D76B1A] group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => router.push(`/org/${orgId}/admin/settings/help-requests#reimbursements`)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-[#5A4A42] hover:bg-[#FBF8F4] border-2 border-[#F7E2BD] transition group"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-[#D76B1A]" />
              <div className="text-left">
                <div className="font-semibold">Reimbursements</div>
                <div className="text-xs text-[#2E2E2E]/70">Turn fosters' reimbursement submissions on or off</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#D76B1A] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
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

      {/* Notification Preferences section — per-user. Each rescue staff
          member controls their own emails. Push always fires regardless. */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-[#D76B1A]" />
          <h2 className="text-lg font-semibold text-[#5A4A42]">Your Notification Preferences</h2>
          {prefsSavedAt && (
            <span className="text-xs text-green-600 ml-auto">Saved</span>
          )}
        </div>
        <p className="text-sm text-[#2E2E2E]/70 mb-4">
          Choose which emails you want from us. Push notifications send for every category and are managed via the toggle below.
        </p>

        <div className="mb-6">
          <PushNotificationToggle audience="admin" />
        </div>

        <h3 className="text-sm font-semibold text-[#5A4A42] mb-3">Email & push by event</h3>
        <p className="text-xs text-[#2E2E2E]/60 mb-3">
          Each row has its own email and push toggle. Push only delivers if you've also enabled it on this device above.
        </p>
        <div className="space-y-3">
          {(
            [
              { key: "messages", label: "Messages from fosters", helper: "When a foster sends you a message" },
              { key: "foster_log_updates", label: "Foster log updates", helper: "When a foster posts a Daily Update on their dog" },
              { key: "appointment_requests", label: "Appointment requests", helper: "When a foster requests an appointment" },
              { key: "supply_requests", label: "Supply requests", helper: "When a foster requests supplies" },
              { key: "reimbursement_requests", label: "Reimbursement requests", helper: "When a foster submits a reimbursement" },
            ] as const
          ).map((row) => (
            <AdminPrefRow
              key={row.key}
              label={row.label}
              helper={row.helper}
              email={notificationPrefs[row.key].email}
              push={notificationPrefs[row.key].push}
              disabled={savingPrefs}
              onChange={(channel, v) =>
                saveNotificationPrefs({
                  ...notificationPrefs,
                  [row.key]: { ...notificationPrefs[row.key], [channel]: v },
                })
              }
            />
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-[#FBF8F4] border border-[#F7E2BD]/50">
          <h4 className="text-sm font-semibold text-[#5A4A42] mb-2">Always sent</h4>
          <p className="text-xs text-[#2E2E2E]/70 leading-relaxed">
            Account-level emails — your welcome email when you signed up, password resets, and rescue-wide notifications you trigger from this page (paused / closed) — always come through.
          </p>
        </div>
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

                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                      Attachments{" "}
                      <span className="text-[#5A4A42]/60 font-normal">
                        (optional · photos or videos · 25MB max total)
                      </span>
                    </label>
                    <input
                      type="file"
                      name="attachments"
                      multiple
                      accept="image/*,video/*"
                      className="w-full text-sm text-[#5A4A42] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-[#F7E2BD] file:text-sm file:font-medium file:bg-white file:text-[#5A4A42] hover:file:bg-[#FBF8F4] cursor-pointer"
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
