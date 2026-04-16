"use client"

import type React from "react"
import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, AlertCircle, ChevronRight, ChevronLeft, Menu, X, Users, Heart, ChevronDown } from "lucide-react"

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSignupOpen, setMobileSignupOpen] = useState(false)
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false)
  const router = useRouter()

  // Step 1: Basic Info
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")

  // Step 2: About Your Home
  const [livingSituation, setLivingSituation] = useState("")
  const [pets, setPets] = useState<string[]>([])
  const [fosterCount, setFosterCount] = useState("")

  // Step 3: Availability
  const [homeAvailability, setHomeAvailability] = useState("")
  const [dogSizes, setDogSizes] = useState<string[]>([])
  const [restrictions, setRestrictions] = useState<string[]>([])
  const [whyFoster, setWhyFoster] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const validateStep1 = () => {
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
          console.warn("[v0] Welcome email failed to send:", emailError)
        }
      }

      router.push("/foster/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-0 right-0 px-4 sm:px-6 py-4 flex justify-between items-center md:relative">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        
        <div className="hidden md:block">
          <Link href="/login/foster" className="text-sm text-muted-foreground hover:text-foreground transition">
            Already have an account? <span className="font-semibold text-primary">Log in</span>
          </Link>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-muted-foreground hover:text-foreground transition"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-3 border-b border-gray-100 mt-2 space-y-3 px-4">

          {/* CTA Buttons: Sign Up + Login at the top */}
          <div className="flex flex-col gap-2">
            {/* Sign Up dropdown */}
            <div>
              <button
                onClick={() => { setMobileSignupOpen(!mobileSignupOpen); setMobileLoginOpen(false) }}
                className="flex items-center justify-between w-full px-5 py-3 rounded-full font-semibold text-sm border-2 transition-colors hover:bg-orange-50"
                style={{ borderColor: "#D76B1A", color: "#D76B1A" }}
              >
                <span>Sign Up</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileSignupOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileSignupOpen && (
                <div className="mt-1.5 mx-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <Link
                    href="/sign-up/foster"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-orange-50 transition-colors bg-orange-50"
                    onClick={() => { setMobileMenuOpen(false); setMobileSignupOpen(false) }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                      <Heart className="w-4 h-4" style={{ color: "#D76B1A" }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Foster Parent</div>
                      <div className="text-xs text-gray-500">Create your account</div>
                    </div>
                  </Link>
                  <div className="h-px bg-gray-100 mx-4" />
                  <Link
                    href="/sign-up/rescue"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-amber-50 transition-colors"
                    onClick={() => { setMobileMenuOpen(false); setMobileSignupOpen(false) }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(80, 64, 43, 0.12)" }}>
                      <Users className="w-4 h-4" style={{ color: "#50402B" }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Rescue Org</div>
                      <div className="text-xs text-gray-500">Create your account</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Login dropdown */}
            <div>
              <button
                onClick={() => { setMobileLoginOpen(!mobileLoginOpen); setMobileSignupOpen(false) }}
                className="flex items-center justify-between w-full px-5 py-3 rounded-full font-semibold text-sm text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#D76B1A" }}
              >
                <span>Login</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileLoginOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileLoginOpen && (
                <div className="mt-1.5 mx-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <Link
                    href="/login/foster"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-orange-50 transition-colors bg-orange-50"
                    onClick={() => { setMobileMenuOpen(false); setMobileLoginOpen(false) }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                      <Heart className="w-4 h-4" style={{ color: "#D76B1A" }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Foster Parent</div>
                      <div className="text-xs text-gray-500">Login to your dashboard</div>
                    </div>
                  </Link>
                  <div className="h-px bg-gray-100 mx-4" />
                  <Link
                    href="/login/rescue"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-amber-50 transition-colors"
                    onClick={() => { setMobileMenuOpen(false); setMobileLoginOpen(false) }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(80, 64, 43, 0.12)" }}>
                      <Users className="w-4 h-4" style={{ color: "#50402B" }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Rescue Org</div>
                      <div className="text-xs text-gray-500">Login to your dashboard</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Learn More section */}
          <div>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Learn More</p>
            <div className="space-y-0.5">
              <Link
                href="/for-fosters"
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-900 bg-gray-50 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(215, 107, 26, 0.1)" }}>
                  <Heart className="w-3.5 h-3.5" style={{ color: "#D76B1A" }} />
                </div>
                For Fosters
              </Link>
              <Link
                href="/for-rescue-organizations"
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(80, 64, 43, 0.1)" }}>
                  <Users className="w-3.5 h-3.5" style={{ color: "#50402B" }} />
                </div>
                For Rescue Organizations
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="bg-[#FDF6EC] rounded-2xl shadow-lg p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Join as Foster</h1>
              <p className="text-muted-foreground text-sm">
                Step {step} of 3 — {step === 1 ? "Basic Information" : step === 2 ? "About You" : "Availability & Preferences"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Basic Info */}
              {step === 1 && (
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

              {/* Step 2: About Your Home */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="pb-1">
                    <h2 className="text-lg font-bold text-foreground">About Your Home</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Let&apos;s make sure we match you with the right dog.</p>
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

              {/* Step 3: Availability & Preferences */}
              {step === 3 && (
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

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={step === 1 || isLoading}
                  className="flex-1 rounded-full border border-input bg-background px-4 py-3 text-base font-semibold text-foreground hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className="flex-1 rounded-full bg-primary px-4 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
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
