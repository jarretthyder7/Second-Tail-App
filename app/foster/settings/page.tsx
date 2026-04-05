"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Bell, User, LogOut, Save } from "lucide-react"
import Link from "next/link"

export default function FosterSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_updates: true,
    email_messages: true,
    email_reminders: true,
  })

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login/foster")
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("[v0] Error loading profile:", profileError)
        setError("Failed to load profile")
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Load notification preferences if they exist
      if (profileData.notification_preferences) {
        setNotificationPrefs({
          email_updates: profileData.notification_preferences.email_updates ?? true,
          email_messages: profileData.notification_preferences.email_messages ?? true,
          email_reminders: profileData.notification_preferences.email_reminders ?? true,
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        notification_preferences: notificationPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    if (updateError) {
      console.error("[v0] Error saving notification preferences:", updateError)
      setError("Failed to save preferences")
      setIsSaving(false)
      return
    }

    setSuccessMessage("Preferences saved successfully!")
    setIsSaving(false)

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login/foster")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#D76B1A] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#5A4A42]/70 text-sm">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF8F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#F7E2BD] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#FBF8F4] rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-[#5A4A42]" />
          </button>
          <h1 className="text-xl font-bold text-[#5A4A42]">Profile & Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* Profile Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-[#D76B1A]" />
            <h2 className="text-lg font-semibold text-[#5A4A42]">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5A4A42] mb-1">Name</label>
              <p className="text-[#2E2E2E]">{profile?.name || "Not set"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5A4A42] mb-1">Email</label>
              <p className="text-[#2E2E2E]">{profile?.email || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-[#D76B1A]" />
            <h2 className="text-lg font-semibold text-[#5A4A42]">Notification Preferences</h2>
          </div>
          <p className="text-sm text-[#2E2E2E]/70 mb-6">
            Control which email notifications you receive.
          </p>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-xl border-2 border-[#F7E2BD] hover:bg-[#FBF8F4] cursor-pointer transition">
              <div>
                <div className="font-medium text-[#5A4A42]">Email updates from rescues</div>
                <div className="text-xs text-[#2E2E2E]/70">Receive general updates and announcements</div>
              </div>
              <input
                type="checkbox"
                checked={notificationPrefs.email_updates}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email_updates: e.target.checked })}
                className="w-5 h-5 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]/40"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border-2 border-[#F7E2BD] hover:bg-[#FBF8F4] cursor-pointer transition">
              <div>
                <div className="font-medium text-[#5A4A42]">Email alerts for new messages</div>
                <div className="text-xs text-[#2E2E2E]/70">Get notified when you receive a new message</div>
              </div>
              <input
                type="checkbox"
                checked={notificationPrefs.email_messages}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email_messages: e.target.checked })}
                className="w-5 h-5 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]/40"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border-2 border-[#F7E2BD] hover:bg-[#FBF8F4] cursor-pointer transition">
              <div>
                <div className="font-medium text-[#5A4A42]">Email reminders for appointments</div>
                <div className="text-xs text-[#2E2E2E]/70">Receive reminders before upcoming appointments</div>
              </div>
              <input
                type="checkbox"
                checked={notificationPrefs.email_reminders}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email_reminders: e.target.checked })}
                className="w-5 h-5 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]/40"
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-6 flex items-center gap-2 px-6 py-2 rounded-full bg-[#D76B1A] text-white text-sm font-semibold hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#5A4A42] mb-4">Account</h2>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 border-2 border-red-100 transition"
          >
            <LogOut className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">Sign Out</div>
              <div className="text-xs text-red-500/70">Log out of your account</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
