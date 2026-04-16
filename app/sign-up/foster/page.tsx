"use client"

import type React from "react"
import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { AlertCircle, ChevronRight, ChevronLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]

function FosterSignUpForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Step 2: About Your Home (displayed as step 1)
  const [livingSituation, setLivingSituation] = useState("")
  const [pets, setPets] = useState<string[]>([])
  const [fosterCount, setFosterCount] = useState("")

  // Step 3: Availability (displayed as step 2)
  const [homeAvailability, setHomeAvailability] = useState("")
  const [dogSizes, setDogSizes] = useState<string[]>([])
  const [restrictions, setRestrictions] = useState<string[]>([])
  const [whyFoster, setWhyFoster] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Step 1: Basic Info (displayed as step 3)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")

  const validateStep1 = () => {
    if (!livingSituation) {
      setError("Please select your living situation")
      return false
    }
    if (pets.length === 0) {
      setError("Please select your current pets")
      return false
    }
    if (!fosterCount) {
      setError("Please select your fostering experience")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!homeAvailability) {
      setError("Please select your daytime availability")
      return false
    }
    if (dogSizes.length === 0) {
      setError("Please select at least one dog size")
      return false
    }
    if (restrictions.length === 0) {
      setError("Please select any breed restrictions")
      return false
    }
    if (!whyFoster.trim()) {
      setError("Please tell us why you want to foster")
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!fullName.trim()) {
      setError("Full name is required")
      return false
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Valid email is required")
      return false
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    if (!city.trim()) {
      setError("City is required")
      return false
    }
    if (!state) {
      setError("State is required")
      return false
    }
    return true
  }
    if (!email.trim() || !email.includes("@")) {
      setError("Valid email is required")
      return false
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    if (!city.trim()) {
      setError("City is required")
      return false
    }
    if (!state) {
      setError("State is required")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!livingSituation) {
      setError("Please select your living situation")
      return false
    }
    if (pets.length === 0) {
      setError("Please select your current pets")
      return false
    }
    if (!fosterCount) {
      setError("Please select your fostering experience")
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!homeAvailability) {
      setError("Please select your daytime availability")
      return false
    }
    if (dogSizes.length === 0) {
      setError("Please select at least one dog size")
      return false
    }
    return true
  }

  const handleNext = () => {
    setError("")
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handlePrev = () => {
    setError("")
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const togglePetCheckbox = (pet: string) => {
    setPets(prev =>
      prev.includes(pet) ? prev.filter(p => p !== pet) : [...prev, pet]
    )
  }

  const toggleDogSizeCheckbox = (size: string) => {
    setDogSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }

  const toggleRestrictionCheckbox = (restriction: string) => {
    setRestrictions(prev =>
      prev.includes(restriction) ? prev.filter(r => r !== restriction) : [...prev, restriction]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Create auth account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            name: fullName,
            role: "foster",
          },
        },
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: email,
          name: fullName,
          role: "foster",
          organization_id: null,
        })

        if (profileError) {
          throw new Error("Failed to create profile")
        }

        // Create foster profile with vetting answers
        const { error: fosterProfileError } = await supabase.from("foster_profiles").insert({
          user_id: authData.user.id,
          city,
          state,
          housing_type: livingSituation,
          has_yard: livingSituation.includes("yard"),
          has_pets: pets.length > 0 && !pets.includes("None"),
          existing_pets_description: pets.join(", "),
          preferred_dog_sizes: dogSizes,
          onboarding_completed: false,
        })

        if (fosterProfileError) {
          throw new Error("Failed to create foster profile")
        }

        // Send welcome email
        try {
          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "welcome-foster",
              email: email,
              name: fullName,
            }),
          })
        } catch (emailError) {
          // Welcome email failed to send, but signup was successful
        }
      }

      router.push("/auth/sign-up-success?type=foster")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />


      <div className="container mx-auto px-4 py-8 sm:py-12 lg:pt-24">
        <div className="max-w-md mx-auto">
          <div className="bg-[#FDF6EC] rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Join as Foster</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Step {step} of 3 — {step === 1 ? "About Your Home" : step === 2 ? "Availability & Preferences" : "Basic Information"}
              </p>
            </div>

            {step === 1 && (
              <div className="bg-[#FEF3E8] rounded-lg p-4 space-y-3 border border-[#D76B1A]/10">
                <p className="text-sm text-foreground leading-relaxed">
                  We match rescue dogs with caring foster families. Tell us about your home and lifestyle, and we'll connect you with dogs that are a great fit.
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">What happens next:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                    <li>Complete a brief profile (3 steps, ~5 minutes)</li>
                    <li>Create your account with email verification</li>
                    <li>Browse available dogs and matches in your dashboard</li>
                    <li>Connect with rescue organizations</li>
                  </ul>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: About Your Home */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="pb-1">
                    <h2 className="text-lg font-bold text-foreground">About Your Home</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Let rescues match you with the right dog.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">What&apos;s your living situation? *</label>
                    <div className="flex flex-wrap gap-2">
                      {["Own a house with a yard", "Own a house without a yard", "Rent a house", "Rent an apartment", "Condo", "Other"].map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setLivingSituation(option)}
                          className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-colors min-h-[44px] ${
                            livingSituation === option
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Current pets at home? *</label>
                    <div className="flex flex-wrap gap-2">
                      {["Dogs", "Cats", "None", "Other"].map(pet => (
                        <button
                          key={pet}
                          type="button"
                          onClick={() => togglePetCheckbox(pet)}
                          className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-colors min-h-[44px] ${
                            pets.includes(pet)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          {pet}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">How many dogs have you fostered before? *</label>
                    <div className="flex flex-wrap gap-2">
                      {["This is my first time", "1-3 dogs", "4-10 dogs", "10+ dogs"].map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFosterCount(option)}
                          className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-colors min-h-[44px] ${
                            fosterCount === option
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Availability & Preferences */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">What&apos;s your typical daytime availability? *</label>
                    <div className="flex flex-wrap gap-2">
                      {["Home most/all day", "Home part-time (afternoons/evenings)", "Work outside home, active evenings", "Limited availability"].map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setHomeAvailability(option)}
                          className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-colors min-h-[44px] ${
                            homeAvailability === option
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">What size dogs can you foster? *</label>
                    <div className="flex flex-wrap gap-2">
                      {["Small", "Medium", "Large", "XL"].map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleDogSizeCheckbox(size)}
                          className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-colors min-h-[44px] ${
                            dogSizes.includes(size)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Are there any dogs that wouldn&apos;t be a good fit for your home? *</label>
                    <div className="flex flex-wrap gap-2">
                      {["No other dogs", "No cats", "No young children", "None"].map(restriction => (
                        <button
                          key={restriction}
                          type="button"
                          onClick={() => toggleRestrictionCheckbox(restriction)}
                          className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-colors min-h-[44px] ${
                            restrictions.includes(restriction)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          {restriction}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">What draws you to fostering? <span className="font-normal text-muted-foreground">(Optional — helps us tell your story)</span></label>
                    <textarea
                      value={whyFoster}
                      onChange={(e) => setWhyFoster(e.target.value)}
                      placeholder="Share what inspired you to foster..."
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition min-h-[100px] leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Basic Info */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Password *</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition min-h-[44px]"
                      required
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={() => setShowPassword(!showPassword)}
                        className="w-4 h-4"
                      />
                      <span className="text-xs text-muted-foreground">Show password</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Confirm Password *</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition min-h-[44px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Los Angeles"
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">State *</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                      required
                    >
                      <option value="">Select a state</option>
                      {US_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className={`flex gap-3 pt-4 ${step === 1 ? "" : ""}`}>
                {step !== 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={isLoading}
                    className="flex-1 rounded-full border border-input bg-background px-4 py-3 text-base font-semibold text-foreground hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className={`rounded-full bg-primary px-4 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] ${step === 1 ? "w-full" : "flex-1"}`}
                  >
                    {step === 1 ? "Get Started" : "Next"}
                    {step !== 1 && <ChevronRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 rounded-full bg-primary px-4 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}

export default function FosterSignUpPage() {
  return (
    <Suspense fallback={null}>
      <FosterSignUpForm />
    </Suspense>
  )
}
