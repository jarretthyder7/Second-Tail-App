"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CalendarIcon, Clock, Dog, MapPin, Package, CheckCircle2, Plus } from "lucide-react"
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
  const orgId = params.orgId as string

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false) // Added state for request appointment modal

  useEffect(() => {
    loadAppointments()
  }, [orgId])

  async function loadAppointments() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

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
      console.error("[v0] Error loading appointments:", error)
    } else {
      setAppointments(data || [])
    }
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
          <Button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Request Appointment
          </Button>
        </div>

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

      {showRequestModal && (
        <AppointmentRequestModal dogId={appointments[0]?.dog_id} onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  )
}
