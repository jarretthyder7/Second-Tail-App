"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CalendarIcon, Clock, Dog, MapPin, Package, CheckCircle2, Plus, Hourglass, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppointmentDetailModal } from "@/components/foster/appointment-detail-modal"
import { AppointmentRequestModal } from "@/components/foster/appointment-request-modal"

type Appointment = {
  id: string
  title: string
  description: string | null
  appointment_type: string
  start_time: string
  end_time: string
  location: string | null
  items_needed: string[] | null
  status: string
  dog: { id: string; name: string; breed: string; image_url: string } | null
  notes: string | null
  assigned_to: string | null
  organization_id: string
  dog_id: string
}

export default function FosterAppointmentsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const shouldOpenNew = searchParams.get("new") === "true"

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [dog, setDog] = useState<{ id: string; name: string; breed: string; image_url: string } | null>(null)
  const [hasAutoOpened, setHasAutoOpened] = useState(false)

  useEffect(() => {
    loadData()
  }, [orgId])

  // Auto-open request modal if ?new=true is in URL
  useEffect(() => {
    if (shouldOpenNew && dog && !hasAutoOpened && !loading) {
      setShowRequestModal(true)
      setHasAutoOpened(true)
    }
  }, [shouldOpenNew, dog, hasAutoOpened, loading])

  async function loadData() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // Fetch foster's current dog
    const { data: dogData } = await supabase
      .from("dogs")
      .select("id, name, breed, image_url")
      .eq("foster_id", user.id)
      .eq("status", "fostered")
      .limit(1)
      .single()

    if (dogData) {
      setDog(dogData)
    }

    // Fetch appointments
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        dog:dogs(id, name, breed, image_url)
      `,
      )
      .eq("foster_id", user.id)
      .eq("organization_id", orgId)
      .order("start_time", { ascending: true })

    if (error) {
      console.error("Error loading appointments:", error)
    } else {
      setAppointments(data || [])
    }

    // Fetch pending appointment requests submitted by this foster
    const { data: requestsData } = await supabase
      .from("appointment_requests")
      .select("*, dog:dogs(id, name, breed, image_url)")
      .eq("foster_id", user.id)
      .eq("organization_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    setPendingRequests(requestsData || [])

    setLoading(false)
  }

  const typeLabels: Record<string, string> = {
    vet_visit: "Vet Visit",
    home_check: "Home Check",
    drop_off: "Drop Off",
    pick_up: "Pick Up",
    training: "Training",
    meet_and_greet: "Meet & Greet",
    foster_check_in: "Foster Check-In",
    team_meeting: "Team Meeting",
    other: "Other",
  }

  const upcomingAppointments = appointments.filter(
    (appt) => new Date(appt.start_time) > new Date() && appt.status === "scheduled",
  )
  const pastAppointments = appointments.filter(
    (appt) => new Date(appt.start_time) <= new Date() || appt.status === "completed",
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#5A4A42]">Loading your appointments...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-[#FBF8F4]">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#2E2E2E]">My Appointments</h1>
          {dog && (
            <Button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Request Appointment
            </Button>
          )}
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#5A4A42] mb-4 flex items-center gap-2">
              <Hourglass className="w-4 h-4 text-amber-500" />
              Pending Requests
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-amber-500 text-white">
                {pendingRequests.length}
              </span>
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <Card key={req.id} className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {req.dog?.image_url && (
                        <img
                          src={req.dog.image_url || "/placeholder.svg"}
                          alt={req.dog?.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-[#2E2E2E] capitalize">
                            {req.appointment_type?.replace(/-/g, " ")}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                            Awaiting Confirmation
                          </span>
                        </div>
                        {req.dog && (
                          <div className="flex items-center gap-1.5 text-sm text-[#5A4A42] mb-1">
                            <Dog className="w-3.5 h-3.5" />
                            {req.dog.name}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-sm text-[#5A4A42]/70">
                          {req.preferred_date && (
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {new Date(req.preferred_date + "T00:00:00").toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          )}
                          {req.preferred_time && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {req.preferred_time}
                            </div>
                          )}
                        </div>
                        {req.reason && (
                          <p className="mt-1 text-xs text-[#5A4A42]/60 italic truncate">{req.reason}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#5A4A42] mb-4">Upcoming</h2>
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto text-[#5A4A42]/30 mb-4" />
                <p className="text-[#5A4A42]">No upcoming appointments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appt) => (
                <Card
                  key={appt.id}
                  className="cursor-pointer hover:shadow-md transition"
                  onClick={() => setSelectedAppointment(appt)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {appt.dog?.image_url && (
                        <img
                          src={appt.dog.image_url || "/placeholder.svg"}
                          alt={appt.dog.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-[#2E2E2E]">{appt.title}</h3>
                          <span className="px-2 py-1 rounded-full text-xs bg-[#F7E2BD] text-[#5A4A42]">
                            {typeLabels[appt.appointment_type]}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-[#5A4A42]">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(appt.start_time).toLocaleString()}
                          </div>
                          {appt.dog && (
                            <div className="flex items-center gap-2">
                              <Dog className="w-4 h-4" />
                              {appt.dog.name}
                            </div>
                          )}
                          {appt.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {appt.location}
                            </div>
                          )}
                          {appt.items_needed && appt.items_needed.length > 0 && (
                            <div className="flex items-start gap-2 mt-2">
                              <Package className="w-4 h-4 mt-0.5" />
                              <div>
                                <div className="font-medium">Items to bring:</div>
                                <ul className="list-disc list-inside">
                                  {appt.items_needed.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                        {appt.description && (
                          <p className="mt-2 text-sm text-[#5A4A42] border-t border-[#F7E2BD] pt-2">
                            {appt.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[#5A4A42] mb-4">Past Appointments</h2>
            <div className="space-y-3">
              {pastAppointments.slice(0, 5).map((appt) => (
                <Card
                  key={appt.id}
                  className="opacity-60 cursor-pointer hover:opacity-100 transition"
                  onClick={() => setSelectedAppointment(appt)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-[#2E2E2E]">{appt.title}</h3>
                        <p className="text-sm text-[#5A4A42]">{new Date(appt.start_time).toLocaleDateString()}</p>
                      </div>
                      {appt.status === "completed" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedAppointment && (
        <AppointmentDetailModal appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} />
      )}

      {showRequestModal && dog && (
        <AppointmentRequestModal dog={dog} orgId={orgId} onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  )
}
