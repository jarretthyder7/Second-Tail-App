"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Calendar, AlertCircle, Package, Eye, ChevronRight, Smile, HelpCircle, Plus } from "lucide-react"
import { NewMessageModal } from "@/components/foster/new-message-modal"
import { RequestHelpModal } from "@/components/foster/request-help-modal"

export default function FosterDashboardPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [dog, setDog] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        setUser(authUser)
        console.log("Auth user ID:", authUser.id)

        // Fetch profile
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()
        setProfile(profileData)
        console.log("Profile data:", profileData)

        const { data: dogsData, error: dogsError } = await supabase
          .from("dogs")
          .select("*")
          .eq("foster_id", authUser.id)
          .eq("status", "fostered")
          .limit(1)

        console.log("Dogs query - Auth ID:", authUser.id)
        console.log("Dogs query result:", dogsData)
        console.log("Dogs query error:", dogsError)

        if (dogsData && dogsData.length > 0) {
          setDog(dogsData[0])
          console.log("Dog loaded successfully:", dogsData[0].name)

          const { data: appointmentsData } = await supabase
            .from("appointments")
            .select("*")
            .eq("foster_id", authUser.id)
            .gte("appointment_date", new Date().toISOString())
            .order("appointment_date", { ascending: true })
            .limit(3)

          if (appointmentsData) {
            setAppointments(appointmentsData)
            console.log("Upcoming appointments:", appointmentsData)
          }
        } else {
          console.log("No dogs found for foster. Checking all dogs to debug...")
          const { data: allDogs, error: allDogsError } = await supabase
            .from("dogs")
            .select("*")
            .eq("foster_id", authUser.id)

          console.log("All dogs for this foster:", allDogs)
          console.log("Error:", allDogsError)
        }
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-card rounded-2xl shadow-sm p-6 sm:p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Welcome!</h2>
            <p className="text-muted-foreground mb-6 text-base sm:text-lg leading-relaxed">
              You'll be matched with an animal soon. Check back here for updates!
            </p>
            <Link
              href={`/org/${orgId}/foster/explore`}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition"
            >
              Explore Nearby Rescues
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Hero Card - Animal Introduction */}
        <div className="relative">
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="relative aspect-square sm:aspect-video overflow-hidden bg-muted">
              <img
                src={dog.image_url || "/placeholder.svg?height=400&width=400&query=animal"}
                alt={dog.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Hi {profile?.name?.split(" ")[0]}</p>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{dog.name}</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  Thank you for fostering. You're making a life-changing difference.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Species & Breed</p>
                  <p className="font-semibold text-sm text-foreground">{dog.breed || "N/A"}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">In Your Care Since</p>
                  <p className="font-semibold text-sm text-foreground">
                    {dog.intake_date
                      ? new Date(dog.intake_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* View Profile Button */}
              <Link
                href={`/org/${orgId}/foster/dog/${dog.id}`}
                className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium hover:bg-primary/90 transition"
              >
                <Eye className="w-4 h-4" />
                View Full Profile
              </Link>
            </div>
          </div>
        </div>

        {appointments.length > 0 && (
          <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Appointments
            </h2>
            <div className="space-y-3">
              {appointments.map((apt) => (
                <Link
                  key={apt.id}
                  href={`/org/${orgId}/foster/appointments`}
                  className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-sm text-foreground">{apt.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(apt.appointment_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Action Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Daily Update */}
          <Link
            href={`/org/${orgId}/foster/dog/${dog.id}?tab=log`}
            className="bg-card rounded-xl p-4 hover:shadow-md transition group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/10 transition">
                  <Smile className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Add Update</h3>
                <p className="text-xs text-muted-foreground mt-1">Share photos & notes</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </div>
          </Link>

          {/* Request Supplies Button */}
          <Link
            href={`/org/${orgId}/foster/request-supplies?new=true`}
            className="bg-card rounded-xl p-4 hover:shadow-md transition group text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/10 transition">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Request Supplies</h3>
                <p className="text-xs text-muted-foreground mt-1">Food, toys, meds</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </div>
          </Link>

          {/* Request Appointment Button */}
          <Link
            href={`/org/${orgId}/foster/appointments?new=true`}
            className="bg-card rounded-xl p-4 hover:shadow-md transition group text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/10 transition">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Request Appointment</h3>
                <p className="text-xs text-muted-foreground mt-1">Schedule a visit</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </div>
          </Link>

          {/* Need Help Button */}
          <button
            onClick={() => setShowSupportModal(true)}
            className="bg-card rounded-xl p-4 hover:shadow-md transition group text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/10 transition">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Need Help?</h3>
                <p className="text-xs text-muted-foreground mt-1">Get support</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </div>
          </button>
        </div>

        {/* Care Information */}
        {(dog.medical_notes || dog.behavior_notes) && (
          <div className="space-y-4">
            {dog.medical_notes && (
              <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Medical Care
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{dog.medical_notes}</p>
              </div>
            )}
            {dog.behavior_notes && (
              <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Behavior Notes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{dog.behavior_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showMessageModal && <NewMessageModal dog={dog} onClose={() => setShowMessageModal(false)} />}
      {showSupportModal && (
        <RequestHelpModal
          dog={dog}
          onClose={() => setShowSupportModal(false)}
        />
      )}
    </div>
  )
}
