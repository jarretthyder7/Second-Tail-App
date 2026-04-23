"use client"

import type React from "react"
import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { createProfileAfterSignup } from "@/app/sign-up/actions"
import Link from "next/link"
import { AlertCircle, ChevronRight, ChevronLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"


function FosterSignUpForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resentMessage, setResentMessage] = useState("")
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
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [zip, setZip] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipLoading, setZipLoading] = useState(false)

  const handleZipChange = async (value: string) => {
    setZip(value)
    if (value.length === 5 && /^\d{5}$/.test(value)) {
      setZipLoading(true)
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${value}`)
        if (res.ok) {
          const data = await res.json()
          const place = data.places?.[0]
          if (place) {
            setCity(place["place name"])
            setState(place["state abbreviation"] || "")
          }
        }
      } catch {}
      setZipLoading(false)
    }
  }

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
    const phoneDigits = phone.replace(/\D/g, "")
    if (phoneDigits.length < 10) {
      setError("Please enter a valid phone number")
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
      setError("City is required — enter your ZIP code to auto-fill")
      return false
    }
    if (!state.trim()) {
      setError("State is required — enter your ZIP code to auto-fill")
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
            phone,
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
      if (!authData.user) throw new Error("Signup returned no user")

      // If Supabase is set to require email confirmation, signUp() returns a
      // user but NO session. Don't try to redirect them to a gated dashboard —
      // show them a "check your email" screen instead. Profile creation will
      // happen in /auth/callback AFTER they click the confirmation link.
      if (!authData.session) {
        try {
          const ph = (window as any).posthog
          if (ph?.capture) {
            ph.capture("foster_signup_email_confirmation_sent", { state })
          }
        } catch {}
        setNeedsConfirmation(true)
        setIsLoading(false)
        return
      }

      // Email confirmation OFF — we already have a session, create the profile
      // now and redirect to the dashboard.
      const result = await createProfileAfterSignup(authData.user.id)
      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }
      if (result.redirectTo) {
        try {
          const ph = (window as any).posthog
          if (ph?.identify && authData.user) {
            ph.identify(authData.user.id, { email: authData.user.email })
          }
          if (ph?.capture) {
            ph.capture('foster_signup_completed', {
              state,
              has_pets: pets.length > 0 && !pets.includes('None'),
              has_yard: livingSituation.toLowerCase().includes('yard'),
              foster_count: fosterCount,
              foster_duration: fosterDuration,
            })
          }
          await new Promise((r) => setTimeout(r, 150))
        } catch {}
        window.location.href = result.redirectTo
      }
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
            {needsConfirmation ? (
              <div className="py-4 space-y-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click it to activate your foster account and start seeing animals.
                </p>
                <p className="text-xs text-muted-foreground">
                  The link works on any device — if you opened this on your phone, you can click the email link on your laptop, or vice versa.
                </p>
                {resentMessage && (
                  <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm py-2 px-3">
                    {resentMessage}
                  </div>
                )}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={async () => {
                      setResentMessage("")
                      setIsResending(true)
                      try {
                        const supabase = createClient()
                        const { error } = await supabase.auth.resend({
                          type: "signup",
                          email,
                          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
                        })
                        if (error) {
                          setResentMessage(`Couldn't resend: ${error.message}`)
                        } else {
                          setResentMessage("Confirmation email resent. Check your inbox + spam.")
                        }
                      } catch (err) {
                        setResentMessage("Couldn't resend right now. Try again in a minute.")
                      }
                      setIsResending(false)
                    }}
                    className="text-sm text-primary font-semibold hover:underline disabled:opacity-60"
                  >
                    {isResending ? "Resending…" : "Didn't get it? Resend the email"}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Used the wrong email?{" "}
                    <button
                      type="button"
                      className="text-primary font-medium hover:underline"
                      onClick={() => {
                        setNeedsConfirmation(false)
                        setResentMessage("")
                      }}
                    >
                      Go back to signup
                    </button>
                  </p>
                </div>
              </div>
            ) : (
            <>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Join as Foster</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Takes 2 minutes. Helps rescues match you with the right animal.
              </p>

              {/* Progress pills */}
              <div className="mt-5 flex items-center gap-2">
                {[
                  { n: 1, label: "Your Home" },
                  { n: 2, label: "Availability" },
                  { n: 3, label: "Account" },
                ].map((s) => {
                  const isActive = step === s.n
                  const isComplete = step > s.n
                  return (
                    <div key={s.n} className="flex-1">
                      <div
                        className={`h-1.5 rounded-full transition-colors ${
                          isComplete || isActive ? "bg-primary" : "bg-muted"
                        }`}
                      />
                      <p
                        className={`text-[11px] font-medium mt-1.5 transition-colors ${
                          isActive
                            ? "text-foreground"
                            : isComplete
                              ? "text-primary"
                              : "text-muted-foreground"
                        }`}
                      >
                        {s.n}. {s.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: About Your Home */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="pb-1">
                    <h2 className="text-lg font-bold text-foreground">About Your Home</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Rescues use this to match you with an animal that fits your space.
                    </p>
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
                    <label className="block text-sm font-medium text-foreground mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Rescues may text or call you about urgent updates.</p>
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
                    <label className="block text-sm font-medium text-foreground mb-2">Location *</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={zip}
                          onChange={(e) => handleZipChange(e.target.value)}
                          placeholder="ZIP"
                          maxLength={5}
                          className="w-full rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                        />
                        {zipLoading && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition"
                      />
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        maxLength={2}
                        className="rounded-lg border border-input bg-background px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition uppercase"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Enter ZIP to auto-fill city and state</p>
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
            </>
            )}
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
