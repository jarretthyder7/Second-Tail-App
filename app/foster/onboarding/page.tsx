"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Heart, Home, PawPrint, Sparkles } from "lucide-react"

type OnboardingStep = "welcome" | "about" | "home" | "preferences" | "review"

export default function FosterOnboardingPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const router = useRouter()

  const [formData, setFormData] = useState({
    // Step 1: About You
    name: "",
    phone: "",
    city: "",
    state: "",
    // Step 2: Home & Lifestyle
    housing_type: "",
    has_other_pets: "",
    work_schedule: "",
    // Step 3: Preferences
    experience_level: "",
    dog_types: [] as string[],
    notes: "",
  })

  useEffect(() => {
    const fetchData = async () => {
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

      const { data: fosterProfileData } = await supabase
        .from("foster_profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .single()

      setProfile(profileData)

      if (profileData || fosterProfileData) {
        setFormData({
          name: profileData?.name || "",
          phone: fosterProfileData?.phone || "",
          city: fosterProfileData?.city || "",
          state: fosterProfileData?.state || "",
          housing_type: fosterProfileData?.housing_type || "",
          has_other_pets: fosterProfileData?.has_pets ? "yes" : fosterProfileData?.has_pets === false ? "no" : "",
          work_schedule: fosterProfileData?.schedule_flexibility || "",
          experience_level: fosterProfileData?.comfort_level || "",
          dog_types: fosterProfileData?.preferred_dog_sizes || [],
          notes: "",
        })
      }

      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const goToStep = (step: OnboardingStep) => {
    setCurrentStep(step)
  }

  const goNext = async () => {
    if (currentStep === "welcome") {
      goToStep("about")
    } else if (currentStep === "about") {
      if (!formData.name || !formData.phone || !formData.city || !formData.state) {
        alert("Please fill in all required fields")
        return
      }
      await saveProgress()
      goToStep("home")
    } else if (currentStep === "home") {
      await saveProgress()
      goToStep("preferences")
    } else if (currentStep === "preferences") {
      await saveProgress()
      goToStep("review")
    } else if (currentStep === "review") {
      await completeProfile()
    }
  }

  const goBack = () => {
    if (currentStep === "about") goToStep("welcome")
    else if (currentStep === "home") goToStep("about")
    else if (currentStep === "preferences") goToStep("home")
    else if (currentStep === "review") goToStep("preferences")
  }

  const skipStep = async () => {
    await saveProgress()
    if (currentStep === "home") goToStep("preferences")
    else if (currentStep === "preferences") goToStep("review")
  }

  const saveProgress = async () => {
    if (!user) return

    setIsSaving(true)
    const supabase = createClient()

    if (currentStep === "about" && formData.name) {
      await supabase
        .from("profiles")
        .update({
          name: formData.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    }

    const fosterData: any = {}

    if (currentStep === "about") {
      fosterData.phone = formData.phone
      fosterData.city = formData.city
      fosterData.state = formData.state
    }

    if (currentStep === "home") {
      fosterData.housing_type = formData.housing_type
      fosterData.has_pets = formData.has_other_pets === "yes"
      fosterData.schedule_flexibility = formData.work_schedule
    }

    if (currentStep === "preferences") {
      fosterData.comfort_level = formData.experience_level
      fosterData.preferred_dog_sizes = formData.dog_types
    }

    if (Object.keys(fosterData).length > 0) {
      const { data: existingProfile } = await supabase
        .from("foster_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (existingProfile) {
        const { error } = await supabase
          .from("foster_profiles")
          .update({
            ...fosterData,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (error) {
          console.error("[v0] Error updating foster profile:", error)
        }
      } else {
        const { error } = await supabase.from("foster_profiles").insert({
          user_id: user.id,
          ...fosterData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) {
          console.error("[v0] Error creating foster profile:", error)
        }
      }
    }

    setIsSaving(false)
  }

  const completeProfile = async () => {
    if (!user) return

    setIsCompleting(true)
    const supabase = createClient()

    await supabase
      .from("profiles")
      .update({
        name: formData.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    const fosterData = {
      phone: formData.phone,
      city: formData.city,
      state: formData.state,
      housing_type: formData.housing_type,
      has_pets: formData.has_other_pets === "yes",
      schedule_flexibility: formData.work_schedule,
      comfort_level: formData.experience_level,
      preferred_dog_sizes: formData.dog_types,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    }

    const { data: existingProfile } = await supabase
      .from("foster_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingProfile) {
      const { error } = await supabase.from("foster_profiles").update(fosterData).eq("user_id", user.id)

      if (error) {
        console.error("[v0] Error completing foster profile:", error)
        setIsCompleting(false)
        return
      }
    } else {
      const { error } = await supabase.from("foster_profiles").insert({
        user_id: user.id,
        ...fosterData,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("[v0] Error completing foster profile:", error)
        setIsCompleting(false)
        return
      }
    }

    setIsCompleting(false)
    setOnboardingComplete(true)

    setTimeout(() => {
      window.location.href = "/foster/explore"
    }, 1500)
  }

  const toggleDogType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      dog_types: prev.dog_types.includes(type) ? prev.dog_types.filter((t) => t !== type) : [...prev.dog_types, type],
    }))
  }

  const getStepNumber = (): number => {
    if (currentStep === "welcome") return 0
    if (currentStep === "about") return 1
    if (currentStep === "home") return 2
    if (currentStep === "preferences") return 3
    if (currentStep === "review") return 4
    return 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E07B39] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5A4A42] font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (onboardingComplete) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E07B39] to-[#D4825D] flex items-center justify-center shadow-lg">
              <Check className="w-10 h-10 text-white" fill="white" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora, serif" }}>
              Profile Completed
            </h1>
            <p className="text-xl text-[#8B7355] max-w-xl mx-auto leading-relaxed">
              Your foster profile has been successfully completed.
            </p>
            <p className="text-base text-[#8B7355] max-w-lg mx-auto">
              You will be redirected to the explore page shortly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF8F4] flex flex-col">
      {currentStep !== "welcome" && (
        <header className="bg-white/80 backdrop-blur-sm border-b border-[#E5DED4] sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-[#8B7355] hover:text-[#E07B39] transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </button>
              {currentStep !== "review" && (
                <div className="text-sm font-medium text-[#8B7355]">Step {getStepNumber()} of 3</div>
              )}
              {(currentStep === "home" || currentStep === "preferences") && (
                <button onClick={skipStep} className="text-sm text-[#8B7355] hover:text-[#E07B39] transition">
                  Skip this step
                </button>
              )}
            </div>
            {currentStep !== "review" && (
              <div className="max-w-2xl mx-auto mt-4">
                <div className="w-full bg-[#E5DED4] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#E07B39] to-[#D4825D] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(getStepNumber() / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          {currentStep === "welcome" && (
            <div className="text-center space-y-8 animate-fade-in">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E07B39] to-[#D4825D] flex items-center justify-center shadow-lg">
                  <Heart className="w-10 h-10 text-white" fill="white" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora, serif" }}>
                  Welcome to Second Tail
                </h1>
                <p className="text-xl text-[#8B7355] max-w-xl mx-auto leading-relaxed">
                  Let's get you ready to foster — one step at a time.
                </p>
                <p className="text-base text-[#8B7355] max-w-lg mx-auto">
                  This takes about 2 minutes and helps rescue organizations get to know you.
                </p>
              </div>

              <div className="space-y-4 pt-8">
                <button
                  onClick={() => goNext()}
                  className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#E07B39] text-white font-semibold text-lg hover:bg-[#D4825D] transition shadow-lg hover:shadow-xl"
                >
                  Start
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {currentStep === "about" && (
            <div className="bg-white rounded-3xl shadow-lg border border-[#E5DED4] p-8 md:p-10 space-y-8 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#E07B39]/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#E07B39]" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora, serif" }}>
                  About You
                </h2>
                <p className="text-[#8B7355] max-w-md mx-auto">
                  Just the basics so rescues can contact you.
                  <br />
                  <span className="text-sm">You can edit this anytime.</span>
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                    Full Name <span className="text-[#E07B39]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5DED4] focus:outline-none focus:border-[#E07B39] transition text-[#5A4A42]"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                    Phone Number <span className="text-[#E07B39]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5DED4] focus:outline-none focus:border-[#E07B39] transition text-[#5A4A42]"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                      City <span className="text-[#E07B39]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#E5DED4] focus:outline-none focus:border-[#E07B39] transition text-[#5A4A42]"
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                      State <span className="text-[#E07B39]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#E5DED4] focus:outline-none focus:border-[#E07B39] transition text-[#5A4A42]"
                      placeholder="CA"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={goNext}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#E07B39] text-white font-semibold text-lg hover:bg-[#D4825D] transition shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Next"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {currentStep === "home" && (
            <div className="bg-white rounded-3xl shadow-lg border border-[#E5DED4] p-8 md:p-10 space-y-8 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#E07B39]/10 flex items-center justify-center">
                    <Home className="w-8 h-8 text-[#E07B39]" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora, serif" }}>
                  Home & Lifestyle
                </h2>
                <p className="text-[#8B7355] max-w-md mx-auto">
                  These questions help rescues understand your home setup.
                  <br />
                  <span className="text-sm">Optional — you can skip this.</span>
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Housing Type</label>
                  <select
                    value={formData.housing_type}
                    onChange={(e) => setFormData({ ...formData, housing_type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5DED4] focus:outline-none focus:border-[#E07B39] transition text-[#5A4A42]"
                  >
                    <option value="">Select...</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="condo">Condo</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Do you have other pets?</label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 p-4 border-2 border-[#E5DED4] rounded-xl cursor-pointer hover:border-[#E07B39] transition">
                      <input
                        type="radio"
                        name="has_pets"
                        value="yes"
                        checked={formData.has_other_pets === "yes"}
                        onChange={(e) => setFormData({ ...formData, has_other_pets: e.target.value })}
                        className="w-4 h-4 text-[#E07B39]"
                      />
                      <span className="text-[#5A4A42] font-medium">Yes</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-3 p-4 border-2 border-[#E5DED4] rounded-xl cursor-pointer hover:border-[#E07B39] transition">
                      <input
                        type="radio"
                        name="has_pets"
                        value="no"
                        checked={formData.has_other_pets === "no"}
                        onChange={(e) => setFormData({ ...formData, has_other_pets: e.target.value })}
                        className="w-4 h-4 text-[#E07B39]"
                      />
                      <span className="text-[#5A4A42] font-medium">No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Work Schedule</label>
                  <select
                    value={formData.work_schedule}
                    onChange={(e) => setFormData({ ...formData, work_schedule: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5DED4] focus:outline-none focus:border-[#E07B39] transition text-[#5A4A42]"
                  >
                    <option value="">Select...</option>
                    <option value="home_fulltime">Work from home full-time</option>
                    <option value="hybrid">Hybrid schedule</option>
                    <option value="office_fulltime">In office full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <button
                onClick={goNext}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#E07B39] text-white font-semibold text-lg hover:bg-[#D4825D] transition shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Next"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {currentStep === "preferences" && (
            <div className="bg-white rounded-3xl shadow-lg border border-[#E5DED4] p-8 md:p-10 space-y-8 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#E07B39]/10 flex items-center justify-center">
                    <PawPrint className="w-8 h-8 text-[#E07B39]" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora, serif" }}>
                  Foster Preferences
                </h2>
                <p className="text-[#8B7355] max-w-md mx-auto">
                  There are no wrong answers. This just helps match you with the right dog.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-3">Comfort level with dogs</label>
                  <div className="space-y-2">
                    {[
                      { value: "beginner", label: "Beginner" },
                      { value: "intermediate", label: "Intermediate" },
                      { value: "experienced", label: "Experienced" },
                    ].map((level) => (
                      <label
                        key={level.value}
                        className="flex items-center gap-3 p-4 border-2 border-[#E5DED4] rounded-xl cursor-pointer hover:border-[#E07B39] transition"
                      >
                        <input
                          type="radio"
                          name="experience"
                          value={level.value}
                          checked={formData.experience_level === level.value}
                          onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                          className="w-4 h-4 text-[#E07B39]"
                        />
                        <span className="text-[#5A4A42] font-medium">{level.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-3">
                    What types of dogs are you open to?
                    <span className="block text-xs text-[#8B7355] font-normal mt-1">Select all that apply</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Puppies", "Adults", "Seniors", "Shy dogs", "Medical cases", "Any"].map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleDogType(type)}
                        className={`px-5 py-2.5 rounded-full border-2 font-medium transition ${
                          formData.dog_types.includes(type)
                            ? "bg-[#E07B39] border-[#E07B39] text-white"
                            : "border-[#E5DED4] text-[#8B7355] hover:border-[#E07B39]"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                    Anything you'd like rescues to know?
                    <span className="block text-xs text-[#8B7355] font-normal mt-1">Optional</span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5DED4] focus:outline-none focus:border-[#E07B39] transition text-[#5A4A42] resize-none"
                    placeholder="Any special circumstances, preferences, or questions..."
                  />
                </div>
              </div>

              <button
                onClick={goNext}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#E07B39] text-white font-semibold text-lg hover:bg-[#D4825D] transition shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Review"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {currentStep === "review" && (
            <div className="bg-white rounded-3xl shadow-lg border border-[#E5DED4] p-8 md:p-10 space-y-8 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora, serif" }}>
                  Everything looks good!
                </h2>
                <p className="text-[#8B7355]">Here's a summary of your foster profile.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-[#FBF8F4] rounded-xl p-5 space-y-3">
                  <h3 className="font-semibold text-[#5A4A42] text-sm uppercase tracking-wide">About You</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#8B7355]">Name:</span>
                      <span className="text-[#5A4A42] font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B7355]">Phone:</span>
                      <span className="text-[#5A4A42] font-medium">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B7355]">Location:</span>
                      <span className="text-[#5A4A42] font-medium">
                        {formData.city}, {formData.state}
                      </span>
                    </div>
                  </div>
                </div>

                {(formData.housing_type || formData.has_other_pets || formData.work_schedule) && (
                  <div className="bg-[#FBF8F4] rounded-xl p-5 space-y-3">
                    <h3 className="font-semibold text-[#5A4A42] text-sm uppercase tracking-wide">Home & Lifestyle</h3>
                    <div className="space-y-2 text-sm">
                      {formData.housing_type && (
                        <div className="flex justify-between">
                          <span className="text-[#8B7355]">Housing:</span>
                          <span className="text-[#5A4A42] font-medium capitalize">{formData.housing_type}</span>
                        </div>
                      )}
                      {formData.has_other_pets && (
                        <div className="flex justify-between">
                          <span className="text-[#8B7355]">Other pets:</span>
                          <span className="text-[#5A4A42] font-medium capitalize">{formData.has_other_pets}</span>
                        </div>
                      )}
                      {formData.work_schedule && (
                        <div className="flex justify-between">
                          <span className="text-[#8B7355]">Work schedule:</span>
                          <span className="text-[#5A4A42] font-medium capitalize">
                            {formData.work_schedule.replace("_", " ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(formData.experience_level || formData.dog_types.length > 0) && (
                  <div className="bg-[#FBF8F4] rounded-xl p-5 space-y-3">
                    <h3 className="font-semibold text-[#5A4A42] text-sm uppercase tracking-wide">Preferences</h3>
                    <div className="space-y-2 text-sm">
                      {formData.experience_level && (
                        <div className="flex justify-between">
                          <span className="text-[#8B7355]">Experience:</span>
                          <span className="text-[#5A4A42] font-medium capitalize">{formData.experience_level}</span>
                        </div>
                      )}
                      {formData.dog_types.length > 0 && (
                        <div>
                          <span className="text-[#8B7355]">Open to:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.dog_types.map((type) => (
                              <span
                                key={type}
                                className="px-3 py-1 bg-white rounded-full text-[#5A4A42] text-xs font-medium"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={completeProfile}
                  disabled={isCompleting}
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#E07B39] text-white font-semibold text-lg hover:bg-[#D4825D] transition shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isCompleting ? "Completing..." : "Complete Profile"}
                  <Check className="w-5 h-5" />
                </button>

                <Link
                  href="/foster/dashboard"
                  className="block text-center text-[#8B7355] hover:text-[#E07B39] transition text-sm"
                >
                  Finish later
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
