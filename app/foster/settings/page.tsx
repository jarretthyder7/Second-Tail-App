"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Shield, Bell, ChevronLeft, Save, Check } from "lucide-react"

export default function FosterSettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    zip: "",
  })

  const [preferencesForm, setPreferencesForm] = useState({
    experience_level: "new",
    housing_type: "",
    dog_sizes: [] as string[],
    special_cases: [] as string[],
    availability: [] as string[],
    notes: "",
  })

  const [notificationsForm, setNotificationsForm] = useState({
    email_updates: true,
    email_messages: true,
    email_reminders: true,
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/login/foster")
        return
      }

      setUser(authUser)

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()

      setProfile(profileData)
      setProfileForm({
        name: profileData?.name || "",
        email: authUser.email || "",
        phone: profileData?.phone || "",
        city: profileData?.city || "",
        state: profileData?.state || "",
        zip: profileData?.zip || "",
      })

      setIsLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profileForm.name,
        phone: profileForm.phone,
        city: profileForm.city,
        state: profileForm.state,
        zip: profileForm.zip,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    setIsSaving(false)

    if (!error) {
      setSuccessMessage("Profile saved successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login/foster")
  }

  const toggleArrayValue = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter((v) => v !== value))
    } else {
      setter([...array, value])
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-bark font-medium">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-cream">
      <header className="bg-white/80 backdrop-blur-sm border-b border-[color:var(--color-border-soft)] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/foster/dashboard" className="p-2 hover:bg-neutral-cream rounded-lg transition">
              <ChevronLeft className="w-5 h-5 text-primary-bark" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-primary-bark" style={{ fontFamily: "Lora, serif" }}>
                Profile & Settings
              </h1>
              <p className="text-sm text-text-muted">Manage your foster account</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-primary-bark hover:text-primary-orange transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {successMessage && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top z-50">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-[color:var(--color-border-soft)] overflow-hidden">
          <div className="bg-gradient-to-r from-primary-orange/10 to-secondary-rust/10 p-6 border-b border-[color:var(--color-border-soft)]">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary-orange" />
              <div>
                <h2 className="text-xl font-bold text-primary-bark" style={{ fontFamily: "Lora, serif" }}>
                  Profile
                </h2>
                <p className="text-sm text-text-muted">Your personal information</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary-orange/20 flex items-center justify-center text-2xl font-bold text-primary-orange">
                {profileForm.name.charAt(0).toUpperCase() || "U"}
              </div>
              <button className="px-4 py-2 text-sm font-medium text-primary-orange border-2 border-primary-orange rounded-lg hover:bg-primary-orange/10 transition">
                Change photo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-bark mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[color:var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-primary-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-bark mb-2">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-[color:var(--color-border-soft)] bg-neutral-cream/50 text-text-muted cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-bark mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[color:var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-primary-orange"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-bark mb-2">City</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[color:var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-primary-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-bark mb-2">State</label>
                <input
                  type="text"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[color:var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-primary-orange"
                  placeholder="NY"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-bark mb-2">Zip Code</label>
                <input
                  type="text"
                  value={profileForm.zip}
                  onChange={(e) => setProfileForm({ ...profileForm, zip: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[color:var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-primary-orange"
                  placeholder="10001"
                />
              </div>
            </div>

            <p className="text-sm text-text-muted">
              Your contact details can be shared with rescue organizations you're connected to.
            </p>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-orange text-white font-semibold hover:bg-primary-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        {/* Foster Experience & Preferences Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-[color:var(--color-border-soft)] overflow-hidden">
          <div className="bg-gradient-to-r from-primary-orange/10 to-secondary-rust/10 p-6 border-b border-[color:var(--color-border-soft)]">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary-orange" />
              <div>
                <h2 className="text-xl font-bold text-primary-bark" style={{ fontFamily: "Lora, serif" }}>
                  Foster Experience & Preferences
                </h2>
                <p className="text-sm text-text-muted">Help rescues match you with the right dogs</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-bark mb-2">Experience Level</label>
              <select
                value={preferencesForm.experience_level}
                onChange={(e) => setPreferencesForm({ ...preferencesForm, experience_level: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[color:var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-primary-orange"
              >
                <option value="new">New to fostering</option>
                <option value="1-3">1-3 fosters</option>
                <option value="4-10">4-10 fosters</option>
                <option value="10+">10+ fosters</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-bark mb-3">Dog Size Comfort</label>
              <div className="flex flex-wrap gap-2">
                {["Small", "Medium", "Large", "Extra Large"].map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      toggleArrayValue(preferencesForm.dog_sizes, size, (arr) =>
                        setPreferencesForm({ ...preferencesForm, dog_sizes: arr }),
                      )
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      preferencesForm.dog_sizes.includes(size)
                        ? "bg-primary-orange text-white"
                        : "bg-white border-2 border-primary-bark text-primary-bark hover:bg-neutral-cream"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-bark mb-3">
                Special Cases You're Comfortable With
              </label>
              <div className="flex flex-wrap gap-2">
                {["Puppies", "Seniors", "Medical/Post-op", "Behavior Cases"].map((caseType) => (
                  <button
                    key={caseType}
                    onClick={() =>
                      toggleArrayValue(preferencesForm.special_cases, caseType, (arr) =>
                        setPreferencesForm({ ...preferencesForm, special_cases: arr }),
                      )
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      preferencesForm.special_cases.includes(caseType)
                        ? "bg-primary-orange text-white"
                        : "bg-white border-2 border-primary-bark text-primary-bark hover:bg-neutral-cream"
                    }`}
                  >
                    {caseType}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-bark mb-3">Availability</label>
              <div className="flex flex-wrap gap-2">
                {["Short-term", "Standard (2-6 weeks)", "Long-term (6+ weeks)"].map((avail) => (
                  <button
                    key={avail}
                    onClick={() =>
                      toggleArrayValue(preferencesForm.availability, avail, (arr) =>
                        setPreferencesForm({ ...preferencesForm, availability: arr }),
                      )
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      preferencesForm.availability.includes(avail)
                        ? "bg-primary-orange text-white"
                        : "bg-white border-2 border-primary-bark text-primary-bark hover:bg-neutral-cream"
                    }`}
                  >
                    {avail}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-bark mb-2">
                Anything rescues should know about your setup?
              </label>
              <textarea
                value={preferencesForm.notes}
                onChange={(e) => setPreferencesForm({ ...preferencesForm, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-[color:var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-primary-orange"
                placeholder="Tell rescues about your home, yard, other pets, schedule, etc."
              />
            </div>

            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-orange text-white font-semibold hover:bg-primary-orange/90 transition">
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        </div>

        {/* Account & Security Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-[color:var(--color-border-soft)] overflow-hidden">
          <div className="bg-gradient-to-r from-primary-orange/10 to-secondary-rust/10 p-6 border-b border-[color:var(--color-border-soft)]">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary-orange" />
              <div>
                <h2 className="text-xl font-bold text-primary-bark" style={{ fontFamily: "Lora, serif" }}>
                  Account & Security
                </h2>
                <p className="text-sm text-text-muted">Manage your account settings</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-bark mb-2">Current Email</label>
              <input
                type="email"
                value={profileForm.email}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-[color:var(--color-border-soft)] bg-neutral-cream/50 text-text-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-orange hover:underline"
              >
                Change password
              </Link>
            </div>

            <div className="pt-4 border-t border-[color:var(--color-border-soft)]">
              <button disabled className="text-sm font-medium text-text-muted cursor-not-allowed opacity-50">
                Delete account (Coming soon)
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-[color:var(--color-border-soft)] overflow-hidden">
          <div className="bg-gradient-to-r from-primary-orange/10 to-secondary-rust/10 p-6 border-b border-[color:var(--color-border-soft)]">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary-orange" />
              <div>
                <h2 className="text-xl font-bold text-primary-bark" style={{ fontFamily: "Lora, serif" }}>
                  Notifications
                </h2>
                <p className="text-sm text-text-muted">Manage your notification preferences</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {[
              { key: "email_updates", label: "Email updates from rescues" },
              { key: "email_messages", label: "Email alerts for new messages" },
              { key: "email_reminders", label: "Email reminders for daily logs" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-primary-bark">{label}</label>
                <button
                  onClick={() =>
                    setNotificationsForm({
                      ...notificationsForm,
                      [key]: !notificationsForm[key as keyof typeof notificationsForm],
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    notificationsForm[key as keyof typeof notificationsForm] ? "bg-primary-orange" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationsForm[key as keyof typeof notificationsForm] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}

            <p className="text-sm text-text-muted pt-4">
              We'll only send you notifications related to your foster dogs and rescue updates.
            </p>

            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-orange text-white font-semibold hover:bg-primary-orange/90 transition">
              <Save className="w-4 h-4" />
              Save Notification Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
