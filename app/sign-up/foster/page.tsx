"use client"

import type React from "react"
import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, AlertCircle, Heart } from "lucide-react"

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
]

function FosterSignUpForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Step 1 - Basic Info
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")

  // Step 2 - About You
  const [housingType, setHousingType] = useState("")
  const [ownershipStatus, setOwnershipStatus] = useState("")
  const [yardAvailable, setYardAvailable] = useState("")
  const [currentPets, setCurrentPets] = useState("")
  const [previouslyFostered, setPreviouslyFostered] = useState("")
  const [numAnimalsExperience, setNumAnimalsExperience] = useState("")

  // Step 3 - Availability & Preferences
  const [homeAvailability, setHomeAvailability] = useState("")
  const [preferredSizes, setPreferredSizes] = useState<string[]>([])
  const [restrictions, setRestrictions] = useState("")
  const [reasonForFostering, setReasonForFostering] = useState("")

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Please enter your full name")
      return
    }
    if (!email.trim()) {
      setError("Please enter your email")
      return
    }
    if (password !== repeatPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (!city.trim()) {
      setError("Please enter your city")
      return
    }
    if (!state) {
      setError("Please select your state")
      return
    }

    setStep(2)
  }

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!housingType) {
      setError("Please select your housing type")
      return
    }
    if (!ownershipStatus) {
      setError("Please select your ownership status")
      return
    }
    if (!yardAvailable) {
      setError("Please select yard availability")
      return
    }
    if (!currentPets) {
      setError("Please select current pets")
      return
    }
    if (!previouslyFostered) {
      setError("Please select fostering experience")
      return
    }
    if (previouslyFostered === "yes" && !numAnimalsExperience) {
      setError("Please enter number of animals fostered")
      return
    }

    setStep(3)
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!homeAvailability) {
      setError("Please select home availability")
      setIsLoading(false)
      return
    }
    if (preferredSizes.length === 0) {
      setError("Please select at least one preferred dog size")
      setIsLoading(false)
      return
    }

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
            name: name,
            role: "foster",
          },
        },
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error("Failed to create account")

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: email,
        name: name,
        role: "foster",
        organization_id: null,
      })

      if (profileError) throw profileError

      // Create foster profile
      const { error: fosterError } = await supabase.from("foster_profiles").insert({
        user_id: authData.user.id,
        city: city,
        state: state,
        housing_type: housingType,
        ownership_status: ownershipStatus,
        yard_available: yardAvailable === "yes",
        current_pets: currentPets,
        previously_fostered: previouslyFostered === "yes",
        num_animals_experience: numAnimalsExperience ? parseInt(numAnimalsExperience) : null,
        home_availability: homeAvailability,
        preferred_sizes: preferredSizes,
        restrictions: restrictions || null,
        reason_for_fostering: reasonForFostering || null,
      })

      if (fosterError) throw fosterError

      // Send welcome email
      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "welcome-foster",
            email: email,
            name: name,
          }),
        })
      } catch (emailError) {
        console.warn("[v0] Welcome email failed to send:", emailError)
      }

      router.push("/foster/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const togglePreferredSize = (size: string) => {
    setPreferredSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      <div className="absolute top-0 left-0 right-0 px-6 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <Link href="/login/foster" className="text-sm text-gray-600 hover:text-gray-900 transition">
          Already have an account?{" "}
          <span className="font-semibold" style={{ color: "#D76B1A" }}>
            Log in
          </span>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Join as Foster</h1>
              <p className="text-gray-600">
                Step {step} of 3: {step === 1 ? "Basic Info" : step === 2 ? "About You" : "Availability"}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: s <= step ? "#D76B1A" : "#e5e7eb",
                  }}
                />
              ))}
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    style={{ focusRingColor: "#D76B1A" }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Portland"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  >
                    <option value="">Select a state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-full px-6 py-3 text-base font-semibold text-white hover:opacity-90 transition"
                  style={{ backgroundColor: "#D76B1A" }}
                >
                  Next
                </button>
              </form>
            )}

            {/* Step 2: About You */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Housing Type</label>
                  <select
                    value={housingType}
                    onChange={(e) => setHousingType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  >
                    <option value="">Select housing type</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="condo">Condo</option>
                    <option value="farm">Farm</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Home Ownership</label>
                  <select
                    value={ownershipStatus}
                    onChange={(e) => setOwnershipStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  >
                    <option value="">Select ownership status</option>
                    <option value="own">Own</option>
                    <option value="rent">Rent</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Yard Available?</label>
                  <select
                    value={yardAvailable}
                    onChange={(e) => setYardAvailable(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Current Pets</label>
                  <select
                    value={currentPets}
                    onChange={(e) => setCurrentPets(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="none">None</option>
                    <option value="dogs">Dogs</option>
                    <option value="cats">Cats</option>
                    <option value="both">Both dogs and cats</option>
                    <option value="other">Other animals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Previous Fostering Experience?</label>
                  <select
                    value={previouslyFostered}
                    onChange={(e) => setPreviouslyFostered(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="no">No, first time</option>
                    <option value="yes">Yes, I have experience</option>
                  </select>
                </div>

                {previouslyFostered === "yes" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">How many animals have you fostered?</label>
                    <input
                      type="number"
                      value={numAnimalsExperience}
                      onChange={(e) => setNumAnimalsExperience(e.target.value)}
                      placeholder="Number of animals"
                      min="1"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    />
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-full px-6 py-3 text-base font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-full px-6 py-3 text-base font-semibold text-white hover:opacity-90 transition"
                    style={{ backgroundColor: "#D76B1A" }}
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Availability & Preferences */}
            {step === 3 && (
              <form onSubmit={handleStep3Submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">When is your home available?</label>
                  <select
                    value={homeAvailability}
                    onChange={(e) => setHomeAvailability(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                    required
                  >
                    <option value="">Select availability</option>
                    <option value="immediately">Immediately</option>
                    <option value="weeks">In a few weeks</option>
                    <option value="months">In a few months</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Preferred Dog Sizes</label>
                  <div className="space-y-2">
                    {["Small (under 25 lbs)", "Medium (25-50 lbs)", "Large (50-75 lbs)", "XL (over 75 lbs)"].map(
                      (size) => (
                        <label key={size} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferredSizes.includes(size)}
                            onChange={() => togglePreferredSize(size)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{size}</span>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Any restrictions? (Optional)</label>
                  <input
                    type="text"
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    placeholder="e.g., no senior dogs, no separation anxiety"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Why do you want to foster? (Optional)</label>
                  <textarea
                    value={reasonForFostering}
                    onChange={(e) => setReasonForFostering(e.target.value)}
                    placeholder="Tell us a bit about your motivation..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 transition"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 rounded-full px-6 py-3 text-base font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 rounded-full px-6 py-3 text-base font-semibold text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#D76B1A" }}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </button>
                </div>
              </form>
            )}
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
