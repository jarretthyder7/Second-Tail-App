"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Calendar, AlertCircle, Package, Eye, ChevronRight, Smile, HelpCircle, Plus, PawPrint, Lock } from "lucide-react"
import { NewMessageModal } from "@/components/foster/new-message-modal"
import { RequestHelpModal } from "@/components/foster/request-help-modal"
import { InviteFriendsModal } from "@/components/foster/invite-friends-modal"

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
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        setUser(authUser)

        // Fetch profile
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()
        setProfile(profileData)

        const { data: dogsData } = await supabase
          .from("dogs")
          .select("*")
          .eq("foster_id", authUser.id)
          .eq("status", "fostered")
          .limit(1)

        if (dogsData && dogsData.length > 0) {
          setDog(dogsData[0])

          const { data: appointmentsData } = await supabase
            .from("appointments")
            .select("*")
            .eq("foster_id", authUser.id)
            .gte("appointment_date", new Date().toISOString())
            .order("appointment_date", { ascending: true })
            .limit(3)

          if (appointmentsData) {
            setAppointments(appointmentsData)
          }
        }
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    const handleOpenInviteModal = () => setShowInviteModal(true)
    window.addEventListener("openInviteModal", handleOpenInviteModal)
    return () => window.removeEventListener("openInviteModal", handleOpenInviteModal)
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
    const firstName = (profile?.full_name || profile?.name || "").split(" ")[0] || "there"
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* Hero preview card — mirrors the layout of the real hero card */}
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            <div
              className="relative aspect-[4/3] sm:aspect-video flex items-center justify-center overflow-hidden"
              style={{ background: "linear-gradient(135deg, #FDF6EC 0%, #F7E2BD 100%)" }}
            >
              <div className="text-center px-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/80 backdrop-blur flex items-center justify-center mb-4 shadow-sm">
                  <PawPrint className="w-10 h-10" style={{ color: "#D76B1A" }} />
                </div>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: "#5A4A42", fontFamily: "Lora, serif" }}>
                  Your foster is on the way, {firstName}
                </p>
                <p className="text-sm sm:text-base mt-2" style={{ color: "#5A4A42", opacity: 0.7 }}>
                  Your rescue will match you with an animal soon. When they do, this page becomes your home base.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <Link
                href={`/org/${orgId}/foster/explore`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Explore Nearby Rescues
              </Link>
            </div>
          </div>

          {/* Preview: what unlocks when matched */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4" style={{ color: "#D76B1A" }} />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Here's what unlocks when you're matched
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <PreviewActionCard
                icon={<Smile className="w-5 h-5" />}
                title="Add Daily Updates"
                desc="Share photos and notes — your rescue sees them live"
              />
              <PreviewActionCard
                icon={<Package className="w-5 h-5" />}
                title="Request Supplies"
                desc="Food, toys, medications — sent to your door"
              />
              <PreviewActionCard
                icon={<Plus className="w-5 h-5" />}
                title="Schedule Appointments"
                desc="Vet visits, meet & greets, adoption days"
              />
              <PreviewActionCard
                icon={<HelpCircle className="w-5 h-5" />}
                title="Message Your Rescue"
                desc="Direct line for quick questions or help"
              />
            </div>
          </div>

          {/* While you wait */}
          <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">
              While you wait
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              A few things that'll make your first foster day easier.
            </p>
            <div className="space-y-3">
              <WhileYouWaitItem
                icon="🛏"
                title="Prepare a cozy space"
                desc="Quiet corner with a bed, water bowl, and soft blankets."
              />
              <WhileYouWaitItem
                icon="🛒"
                title="Stock the basics"
                desc="Leash, collar, and waste bags. Food + meds come from your rescue."
              />
              <WhileYouWaitItem
                icon="⏳"
                title="Be patient on day one"
                desc="New environments take a few days. Let them come to you."
              />
            </div>
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
            <div className="relative aspect-[4/3] sm:aspect-video overflow-hidden bg-muted">
              <img
                src={dog.image_url || "/placeholder.svg?height=400&width=400&query=animal"}
                alt={dog.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <p className="text-white/80 text-xs font-medium">Hi {(profile?.full_name || profile?.name)?.split(" ")[0]}</p>
                <h1 className="text-white text-2xl sm:text-3xl font-bold drop-shadow-sm">{dog.name}</h1>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Thank you for fostering. You&apos;re making a life-changing difference.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg p-3" style={{ backgroundColor: "var(--brand-accent, #F7E2BD)" }}>
                  <p className="text-xs text-muted-foreground mb-1">Species & Breed</p>
                  <p className="font-semibold text-sm text-foreground">{dog.breed || "N/A"}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: "var(--brand-accent, #F7E2BD)" }}>
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
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-medium text-white transition hover:opacity-90"
                style={{ backgroundColor: "var(--brand-primary, #D76B1A)" }}
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
              <Calendar className="w-5 h-5" style={{ color: "var(--brand-primary, #D76B1A)" }} />
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
                      {new Date(apt.appointment_date).toLocaleString("en-US", {
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
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition" style={{ backgroundColor: "var(--brand-accent, #F7E2BD)" }}>
                  <Smile className="w-5 h-5" style={{ color: "var(--brand-primary, #D76B1A)" }} />
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
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition" style={{ backgroundColor: "var(--brand-accent, #F7E2BD)" }}>
                  <Package className="w-5 h-5" style={{ color: "var(--brand-primary, #D76B1A)" }} />
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
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition" style={{ backgroundColor: "var(--brand-accent, #F7E2BD)" }}>
                  <Plus className="w-5 h-5" style={{ color: "var(--brand-primary, #D76B1A)" }} />
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
            className="rounded-xl p-4 hover:shadow-md transition group text-left border border-amber-200"
            style={{ backgroundColor: "#FFF8F0" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(215, 107, 26, 0.15)" }}>
                  <HelpCircle className="w-5 h-5" style={{ color: "#D76B1A" }} />
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
                  <Package className="w-5 h-5" style={{ color: "var(--brand-primary, #D76B1A)" }} />
                  Medical Care
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{dog.medical_notes}</p>
              </div>
            )}
            {dog.behavior_notes && (
              <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" style={{ color: "var(--brand-primary, #D76B1A)" }} />
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
      <InviteFriendsModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        fosterName={profile?.full_name || ""}
        referralCode=""
      />
    </div>
  )
}

function PreviewActionCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="relative bg-card rounded-xl p-4 border border-gray-100 opacity-75">
      <div className="absolute top-3 right-3">
        <Lock className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: "#F7E2BD", color: "#D76B1A" }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{desc}</p>
    </div>
  )
}

function WhileYouWaitItem({
  icon,
  title,
  desc,
}: {
  icon: string
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-base"
        style={{ backgroundColor: "#FDF6EC" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
      </div>
    </div>
  )
}
