"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Heart, Calendar, DogIcon, Award, Clock } from "lucide-react"

export default function JourneyPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [dogs, setDogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        setUser(authUser)

        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()
        setProfile(profileData)

        // Fetch all dogs this foster has ever had (current and past)
        const { data: dogsData } = await supabase
          .from("dogs")
          .select("*")
          .eq("foster_id", authUser.id)
          .order("intake_date", { ascending: false })

        setDogs(dogsData || [])
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-bark font-medium">Loading your journey...</p>
        </div>
      </div>
    )
  }

  const activeDogs = dogs.filter((dog) => dog.stage === "in_foster")
  const totalDogsFostered = dogs.length
  const joinDate = profile?.created_at ? new Date(profile.created_at) : new Date()
  const monthsActive = Math.max(1, Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-primary-orange/20 flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10 text-primary-orange" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary-bark">
          {profile?.name ? `${profile.name.split(" ")[0]}'s Journey` : "Your Foster Journey"}
        </h1>
        <p className="text-lg text-text-muted">Celebrating the lives you've touched through fostering</p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-2">
          <DogIcon className="w-8 h-8 text-primary-orange mx-auto" />
          <div className="text-3xl font-bold text-primary-bark">{totalDogsFostered}</div>
          <div className="text-sm text-text-muted">{totalDogsFostered === 1 ? "Dog Fostered" : "Dogs Fostered"}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-2">
          <Clock className="w-8 h-8 text-primary-orange mx-auto" />
          <div className="text-3xl font-bold text-primary-bark">{monthsActive}</div>
          <div className="text-sm text-text-muted">{monthsActive === 1 ? "Month Active" : "Months Active"}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-2">
          <Award className="w-8 h-8 text-primary-orange mx-auto" />
          <div className="text-3xl font-bold text-primary-bark">{activeDogs.length}</div>
          <div className="text-sm text-text-muted">Currently Fostering</div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-primary-bark">Your Badges</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {totalDogsFostered >= 1 && (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary-orange/10 flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-primary-orange" />
              </div>
              <div className="text-sm font-semibold text-primary-bark">First Foster</div>
              <div className="text-xs text-text-muted">Started your journey</div>
            </div>
          )}
          {monthsActive >= 3 && (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary-orange/10 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-primary-orange" />
              </div>
              <div className="text-sm font-semibold text-primary-bark">Committed</div>
              <div className="text-xs text-text-muted">3+ months active</div>
            </div>
          )}
          {totalDogsFostered >= 3 && (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary-orange/10 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8 text-primary-orange" />
              </div>
              <div className="text-sm font-semibold text-primary-bark">Experienced</div>
              <div className="text-xs text-text-muted">3+ dogs fostered</div>
            </div>
          )}
          {totalDogsFostered >= 5 && (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary-orange/10 flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-primary-orange" />
              </div>
              <div className="text-sm font-semibold text-primary-bark">Hero</div>
              <div className="text-xs text-text-muted">5+ lives saved</div>
            </div>
          )}
        </div>
      </div>

      {/* Dog Timeline */}
      {dogs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-bold text-primary-bark">Your Foster Dogs</h2>
          <div className="space-y-4">
            {dogs.map((dog) => (
              <Link
                key={dog.id}
                href={`/org/${orgId}/foster/dog/${dog.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-neutral-clay/20 hover:border-primary-orange hover:shadow-md transition group"
              >
                <img
                  src={dog.image_url || "/placeholder.svg?height=80&width=80&query=dog"}
                  alt={dog.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-primary-bark group-hover:text-primary-orange transition">
                    {dog.name}
                  </h3>
                  <p className="text-sm text-text-muted">{dog.breed}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary-bark">
                    {dog.stage === "in_foster" ? "Currently Fostering" : "Past Foster"}
                  </div>
                  {dog.intake_date && (
                    <div className="text-xs text-text-muted flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {new Date(dog.intake_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {dogs.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center space-y-4">
          <DogIcon className="w-16 h-16 text-text-muted mx-auto" />
          <h3 className="text-xl font-semibold text-primary-bark">Your journey is just beginning!</h3>
          <p className="text-text-muted max-w-md mx-auto">
            Once you're matched with a foster dog, your journey and impact will be tracked here.
          </p>
          <Link
            href={`/org/${orgId}/foster/dashboard`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-orange px-6 py-3 text-sm font-semibold text-white hover:bg-primary-orange/90 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </main>
  )
}
