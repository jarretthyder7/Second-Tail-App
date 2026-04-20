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
  const [childrenInHome, setChildrenInHome] = useState("")
  const [dogSizes, setDogSizes] = useState<string[]>([])
  const [fosterDuration, setFosterDuration] = useState("")
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
    if (!childrenInHome) {
      setError("Please select your household situation")
      return false
    }
    if (dogSizes.length === 0) {
      setError("Please select at least one dog size")
      return false
    }
    if (!fosterDuration) {
      setError("Please select how long you can typically foster")
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!fullName.trim()) {
      setError("Full name is required")
      return false
    }
    if (!email.trim()) {
      setError("Email address is required")
      return false
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address (example: john@domain.com)")
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
      setError("Please select a state")
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
    if (pet === "None") {
      setPets(["None"])
    } else {
      setPets(prev => {
        const withoutNone = prev.filter(p => p !== "None")
        return withoutNone.includes(pet)
          ? withoutNone.filter(p => p !== pet)
          : [...withoutNone, pet]
      })
    }
  }

  const toggleDogSizeCheckbox = (size: string) => {
    setDogSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }


  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError("")
    try {
      // Store the form answers collected in steps 1 & 2 so the callback can
      // save them to the foster profile even though Google bypasses the form submit.
      const intent = btoa(
        JSON.stringify({
          role: "foster",
          livingSituation,
          pets,
          fosterCount,
          childrenInHome,
          dogSizes,
          fosterDuration,
          whyFoster,
        })
      )
      await fetch("/api/auth/store-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
      })

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch {
      setError("Could not sign up with Google. Please try again.")
      setIsLoading(false)
    }
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: fullName,
            full_name: fullName,
            role: "foster",
            city,
            state,
            living_situation: livingSituation,
            pets: pets.join(", "),
            has_pets: pets.length > 0 && !pets.includes("None"),
            has_yard: livingSituation.toLowerCase().includes("yard"),
            dog_sizes: dogSizes,
            foster_duration: fosterDuration,
            why_foster: whyFoster,
            foster_count: fosterCount,
          },
        },
      })

      if (signUpError) throw signUpError

      router.push(`/auth/sign-up-success?type=foster&email=${encodeURIComponent(email)}`)
    } catch (err) {
      const raw = err instanceof Error ? err.message : ""
      if (raw.includes("already registered") || raw.includes("User already registered")) {
        setError("An account with this email already exists. Try logging in instead.")
      } else {
        setError("Something went wrong creating your account. Please try again.")
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />


      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-[#FDF6EC] rounded-2xl shadow-lg p-5 sm:p-8 space-y-5">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Join as Foster</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Step {step} of 3 — {step === 1 ? "About Your Home" : step === 2 ? "Availability & Preferences" : "Create Your Account"}
              </p>
            </div>


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
                      {["House with yard", "House without yard", "Apartment (elevator building)", "Apartment (walk-up/stairs)", "Condo", "Other"].map(option => (
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
                    <label className="block text-sm font-medium text-foreground mb-3">Are there young children in your home? *</label>
                    <div className="flex flex-wrap gap-2">
                      {["No children", "Yes, ages 0–5", "Yes, ages 6–12", "Yes, teens (13+)"].map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setChildrenInHome(option)}
                          className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-colors min-h-[44px] ${
                            childrenInHome === option
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
                    <label className="block text-sm font-medium text-foreground mb-3">How long can you typically foster a dog? *</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "1–2 weeks",
                        "2–4 weeks",
                        "1–3 months",
                        "3+ months",
                        "Open to anything",
                      ].map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFosterDuration(option)}
                          className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-colors min-h-[44px] ${
                            fosterDuration === option
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

                  {/* Google sign-up — shown at the end after all questions are answered */}
                  <div>
                    <button
                      type="button"
                      onClick={handleGoogleSignUp}
                      disabled={isLoading}
                      className="w-full inline-flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign up with Google
                    </button>
                    <div className="relative mt-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-[#FDF6EC] px-3 text-gray-500">or sign up with email</span>
                      </div>
                    </div>
                  </div>

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
