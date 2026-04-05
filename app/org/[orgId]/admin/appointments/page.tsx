"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CalendarIcon, Clock, Plus, DogIcon, User, Users, MapPin, X, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

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
  foster: { id: string; name: string; email: string } | null
  team: { id: string; name: string; type: string } | null
  assigned_staff: { id: string; name: string; email: string } | null
  notes: string | null
}

type Foster = {
  id: string
  name: string
  email: string
}

type Team = {
  id: string
  name: string
  type: string
}

type Dog = {
  id: string
  name: string
  breed: string
  image_url: string
  foster_id?: string
}

export default function AppointmentsPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [dogs, setDogs] = useState<Dog[]>([])
  const [fosters, setFosters] = useState<Foster[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedView, setSelectedView] = useState<"calendar" | "list" | "requests">("calendar")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [saving, setSaving] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    start_time: "",
    end_time: "",
    location: "",
    notes: "",
    description: "",
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)
  const [showColorSettings, setShowColorSettings] = useState(false)
  const [typeColors, setTypeColors] = useState<Record<string, string>>({
    vet_visit: "bg-blue-500",
    home_check: "bg-green-500",
    drop_off: "bg-orange-500",
    pick_up: "bg-purple-500",
    training: "bg-red-500",
    meet_and_greet: "bg-pink-500",
    foster_check_in: "bg-indigo-500",
    team_meeting: "bg-yellow-500",
    other: "bg-gray-500",
  })

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    appointment_type: "foster_check_in",
    start_time: "",
    end_time: "",
    dog_id: "",
    foster_id: "",
    team_id: "",
    location: "",
    items_needed: "",
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [orgId])

  async function loadData() {
    setLoading(true)
    try {
      // Load appointments
      const appointmentsRes = await fetch(`/api/admin/appointments?orgId=${orgId}`)
      const appointmentsData = await appointmentsRes.json()
      setAppointments(appointmentsData.appointments || [])

      // Load dogs
      const dogsRes = await fetch(`/api/admin/dogs?orgId=${orgId}`)
      const dogsData = await dogsRes.json()
      setDogs(dogsData.dogs || [])

      // Load fosters
      const fostersRes = await fetch(`/api/admin/fosters?orgId=${orgId}`)
      const fostersData = await fostersRes.json()
      setFosters(fostersData.fosters || [])

      const supabase = createClient()
      const { data: teamsData } = await supabase.from("teams").select("*").eq("organization_id", orgId)
      setTeams(teamsData || [])

      // Load pending appointment requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("appointment_requests")
        .select("*, dog:dogs(name), foster:profiles!appointment_requests_foster_id_fkey(name, email)")
        .eq("organization_id", orgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (!requestsError) {
        setPendingRequests(requestsData || [])
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAppointment() {
    if (!formData.title || !formData.start_time || !formData.end_time) {
      alert("Please fill in required fields")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          organization_id: orgId,
          dog_id: formData.dog_id || null,
          foster_id: formData.foster_id || null,
          team_id: formData.team_id || null,
          items_needed: formData.items_needed ? formData.items_needed.split(",").map((i) => i.trim()) : [],
        }),
      })

      if (res.ok) {
        try {
          await fetch(`/api/admin/setup-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orgId,
              stepId: "first_appointment",
              isCompleted: true,
            }),
          })
          window.dispatchEvent(new CustomEvent("setup-step-completed", { detail: { stepId: "first_appointment" } }))
        } catch (error) {
          console.error("[v0] Error marking setup step complete:", error)
        }

        setShowNewForm(false)
        setFormData({
          title: "",
          description: "",
          appointment_type: "foster_check_in",
          start_time: "",
          end_time: "",
          dog_id: "",
          foster_id: "",
          team_id: "",
          location: "",
          items_needed: "",
          notes: "",
        })
        loadData()
      }
    } catch (error) {
      console.error("[v0] Error creating appointment:", error)
    } finally {
      setSaving(false)
    }
  }

  async function handleArchiveAppointment(appointmentId: string) {
    if (!confirm("Archive this appointment? It will still appear in the animal's history.")) return

    try {
      const res = await fetch(`/api/admin/appointments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: appointmentId,
          status: "archived",
        }),
      })

      if (res.ok) {
        loadData()
        setShowEditModal(false)
      }
    } catch (error) {
      console.error("[v0] Error archiving appointment:", error)
    }
  }

  async function handleDeleteAppointment(appointmentId: string) {
    if (!confirm("Permanently delete this appointment? This cannot be undone.")) return

    try {
      const res = await fetch(`/api/admin/appointments?id=${appointmentId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        loadData()
        setShowEditModal(false)
      } else {
        const data = await res.json()
        alert(data.error || "Failed to delete appointment")
      }
    } catch (error) {
      console.error("[v0] Error deleting appointment:", error)
      alert("Failed to delete appointment")
    }
  }

  async function handleScheduleRequest(request: any) {
    // Open new appointment form with pre-filled data from request
    setFormData({
      title: `${request.appointment_type} for ${request.dog.name}`,
      description: request.reason || "",
      appointment_type: request.appointment_type,
      start_time: request.preferred_date ? `${request.preferred_date}T${request.preferred_time || "10:00"}` : "",
      end_time: request.preferred_date ? `${request.preferred_date}T${request.preferred_time ? String(parseInt(request.preferred_time) + 1).padStart(2, "0") + ":00" : "11:00"}` : "",
      dog_id: request.dog_id,
      foster_id: request.foster_id,
      team_id: "",
      location: "",
      items_needed: "",
      notes: request.notes || "",
    })
    setShowNewForm(true)
  }

  async function handleDeclineRequest(requestId: string) {
    if (!confirm("Decline this appointment request? The foster will not be notified.")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("appointment_requests")
        .update({ status: "declined" })
        .eq("id", requestId)

      if (!error) {
        loadData()
      }
    } catch (error) {
      console.error("[v0] Error declining request:", error)
    }
  }

  const saveColorSettings = () => {
    localStorage.setItem(`appointmentColors_${orgId}`, JSON.stringify(typeColors))
    setShowColorSettings(false)
  }
    setFormData({ ...formData, dog_id: dogId })

    if (dogId) {
      const selectedDog = dogs.find((d) => d.id === dogId)
      // Auto-populate foster if this dog has one assigned
      if (selectedDog && selectedDog.foster_id) {
        setFormData((prev) => ({
          ...prev,
          dog_id: dogId,
          foster_id: selectedDog.foster_id || "",
        }))
      }
    }
  }

  const getAppointmentColor = (appt: Appointment) => {
    if (appt.status === "archived") {
      return "bg-gray-400 opacity-60"
    }
    return typeColors[appt.appointment_type] || "bg-gray-500"
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

  // Calendar grid generation
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getAppointmentsForDate = (day: number) => {
    const dateStr = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toISOString().split("T")[0]
    return appointments.filter((appt) => appt.start_time.startsWith(dateStr))
  }

  const handleAppointmentClick = (appt: Appointment) => {
    setSelectedAppointment(appt)
    setEditForm({
      title: appt.title,
      start_time: appt.start_time.slice(0, 16), // Format for datetime-local input
      end_time: appt.end_time.slice(0, 16),
      location: appt.location || "",
      notes: appt.notes || "",
      description: appt.description || "",
    })
    setEditSuccess(false)
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedAppointment) return
    setSavingEdit(true)
    setEditSuccess(false)

    try {
      const res = await fetch(`/api/admin/appointments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAppointment.id,
          title: editForm.title,
          start_time: editForm.start_time,
          end_time: editForm.end_time,
          location: editForm.location || null,
          notes: editForm.notes || null,
          description: editForm.description || null,
        }),
      })

      if (res.ok) {
        setEditSuccess(true)
        loadData()
        setTimeout(() => setEditSuccess(false), 3000)
      } else {
        alert("Failed to save changes")
      }
    } catch (error) {
      console.error("[v0] Error saving appointment:", error)
      alert("Failed to save changes")
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#5A4A42]">Loading appointments...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-[#FBF8F4]">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2E2E2E] mb-2">Appointments</h1>
            <p className="text-[#5A4A42]">Schedule and manage appointments with fosters, teams, and dogs</p>
          </div>
          <Button onClick={() => setShowNewForm(true)} className="bg-[#D76B1A] hover:bg-[#D76B1A]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedView("calendar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedView === "calendar" ? "bg-[#D76B1A] text-white" : "bg-white text-[#5A4A42] hover:bg-[#F7E2BD]"
            }`}
          >
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Calendar View
          </button>
          <button
            onClick={() => setSelectedView("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedView === "list" ? "bg-[#D76B1A] text-white" : "bg-white text-[#5A4A42] hover:bg-[#F7E2BD]"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setSelectedView("requests")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              selectedView === "requests" ? "bg-[#D76B1A] text-white" : "bg-white text-[#5A4A42] hover:bg-[#F7E2BD]"
            }`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-red-500 text-white">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Calendar View */}
        {selectedView === "calendar" && (
          <Card>
            <CardHeader className="border-b border-[#F7E2BD]">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                  className="px-3 py-1 rounded hover:bg-[#F7E2BD]"
                >
                  ←
                </button>
                <CardTitle>{selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</CardTitle>
                <button
                  onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                  className="px-3 py-1 rounded hover:bg-[#F7E2BD]"
                >
                  →
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-[#5A4A42] py-2">
                    {day}
                  </div>
                ))}
                {generateCalendarDays().map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="min-h-24 bg-gray-50 rounded" />
                  }
                  const dayAppointments = getAppointmentsForDate(day)
                  return (
                    <div key={day} className="min-h-24 bg-white border border-[#F7E2BD] rounded p-2">
                      <div className="text-sm font-semibold text-[#2E2E2E] mb-1">{day}</div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 2).map((appt) => (
                          <div
                            key={appt.id}
                            onClick={() => handleAppointmentClick(appt)}
                            className={`text-xs px-2 py-1 rounded text-white truncate cursor-pointer hover:opacity-90 transition ${getAppointmentColor(appt)}`}
                          >
                            {new Date(appt.start_time).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            {appt.title}
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="text-xs text-[#5A4A42] px-2">+{dayAppointments.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {selectedView === "list" && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="w-12 h-12 mx-auto text-[#5A4A42]/30 mb-4" />
                  <p className="text-[#5A4A42]">No appointments scheduled yet</p>
                </CardContent>
              </Card>
            ) : (
              appointments.map((appt) => (
                <Card
                  key={appt.id}
                  onClick={() => handleAppointmentClick(appt)}
                  className="cursor-pointer hover:shadow-md transition"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getAppointmentColor(appt)}`} />
                          <h3 className="text-lg font-semibold text-[#2E2E2E]">{appt.title}</h3>
                          <span className="px-2 py-1 rounded-full text-xs bg-[#F7E2BD] text-[#5A4A42]">
                            {typeLabels[appt.appointment_type]}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-[#5A4A42]">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(appt.start_time).toLocaleString()}
                          </div>
                          {appt.dog && (
                            <div className="flex items-center gap-2">
                              <DogIcon className="w-4 h-4" />
                              {appt.dog.name}
                            </div>
                          )}
                          {appt.foster && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {appt.foster.name}
                            </div>
                          )}
                          {appt.team && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {appt.team.name}
                            </div>
                          )}
                          {appt.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {appt.location}
                            </div>
                          )}
                        </div>
                        {appt.description && <p className="mt-2 text-sm text-[#5A4A42]">{appt.description}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Pending Requests View */}
        {selectedView === "requests" && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-[#5A4A42]">
                  <p className="text-lg font-medium">No pending requests</p>
                  <p className="text-sm text-[#5A4A42]/70 mt-1">Fosters will submit appointment requests here</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-[#5A4A42]">{request.appointment_type}</h3>
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-[#5A4A42]">
                          {request.foster && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{request.foster.name}</span>
                            </div>
                          )}
                          {request.dog && (
                            <div className="flex items-center gap-2">
                              <DogIcon className="w-4 h-4" />
                              <span>{request.dog.name}</span>
                            </div>
                          )}
                          {request.preferred_date && (
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{request.preferred_date}</span>
                            </div>
                          )}
                          {request.preferred_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{request.preferred_time}</span>
                            </div>
                          )}
                        </div>
                        {request.reason && <p className="text-sm text-[#5A4A42]/70 mt-2">{request.reason}</p>}
                        {request.notes && <p className="text-xs text-[#5A4A42]/60 italic">Notes: {request.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleScheduleRequest(request)}
                          className="bg-[#D76B1A] hover:bg-[#D76B1A]/90 text-white text-sm"
                        >
                          Schedule It
                        </Button>
                        <Button
                          onClick={() => handleDeclineRequest(request.id)}
                          variant="outline"
                          className="text-gray-600 text-sm"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        <Card className="mt-6">
          <div className="flex items-center justify-between p-4 border-b border-[#F7E2BD]">
            <CardTitle className="text-sm">Color Legend</CardTitle>
            <button
              onClick={() => setShowColorSettings(true)}
              className="p-1 hover:bg-[#F7E2BD] rounded transition"
              title="Customize colors"
            >
              <Settings className="w-4 h-4 text-[#D76B1A]" />
            </button>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(typeLabels).map(([type, label]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${typeColors[type]}`} />
                  <span className="text-sm text-[#5A4A42]">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {showColorSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="border-b border-[#F7E2BD]">
              <div className="flex items-center justify-between">
                <CardTitle>Customize Appointment Colors</CardTitle>
                <button onClick={() => setShowColorSettings(false)} className="p-2 hover:bg-[#F7E2BD] rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {Object.entries(typeLabels).map(([type, label]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#5A4A42]">{label}</span>
                  <select
                    value={typeColors[type]}
                    onChange={(e) => setTypeColors({ ...typeColors, [type]: e.target.value })}
                    className="px-3 py-1 border border-[#F7E2BD] rounded-lg text-sm"
                  >
                    <option value="bg-blue-500">Blue</option>
                    <option value="bg-green-500">Green</option>
                    <option value="bg-orange-500">Orange</option>
                    <option value="bg-purple-500">Purple</option>
                    <option value="bg-red-500">Red</option>
                    <option value="bg-pink-500">Pink</option>
                    <option value="bg-indigo-500">Indigo</option>
                    <option value="bg-yellow-500">Yellow</option>
                    <option value="bg-gray-500">Gray</option>
                    <option value="bg-teal-500">Teal</option>
                    <option value="bg-cyan-500">Cyan</option>
                  </select>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#F7E2BD]">
                <Button onClick={() => setShowColorSettings(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={saveColorSettings} className="bg-[#D76B1A] text-white">
                  Save Colors
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader className="border-b border-[#F7E2BD]">
              <div className="flex items-center justify-between">
                <CardTitle>Edit Appointment</CardTitle>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-[#F7E2BD] rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {editSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  Changes saved successfully!
                </div>
              )}
              <div>
                <Label>Title</Label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                />
              </div>
              <div>
                <Label>Appointment Type</Label>
                <p className="text-sm text-[#5A4A42] py-2">{typeLabels[selectedAppointment.appointment_type]}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <input
                    type="datetime-local"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <input
                    type="datetime-local"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="e.g., Vet clinic, foster home"
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                />
              </div>
              {selectedAppointment.dog && (
                <div>
                  <Label>Animal</Label>
                  <p className="text-sm text-[#5A4A42] py-2">{selectedAppointment.dog.name}</p>
                </div>
              )}
              <div>
                <Label>Description</Label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Additional details about the appointment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Internal notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                />
              </div>
              <div className="flex justify-between gap-3 pt-4 border-t border-[#F7E2BD]">
                <div className="flex gap-2">
                  {selectedAppointment.status !== "archived" && (
                    <Button
                      onClick={() => handleArchiveAppointment(selectedAppointment.id)}
                      variant="outline"
                      className="text-gray-600"
                    >
                      Archive
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
                <div className="flex gap-2">
                  {selectedAppointment.foster_id && (
                    <Button
                      onClick={async () => {
                        try {
                          await fetch(`/api/email/send`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              type: "appointment_reminder",
                              fosterEmail: selectedAppointment.foster?.email,
                              fosterName: selectedAppointment.foster?.name,
                              dogName: selectedAppointment.dog?.name,
                              appointmentTitle: selectedAppointment.title,
                              appointmentTime: new Date(selectedAppointment.start_time).toLocaleString(),
                              location: selectedAppointment.location,
                              itemsNeeded: selectedAppointment.items_needed,
                              arrivalInstructions: selectedAppointment.description,
                            }),
                          })
                          alert("Notification sent to foster!")
                        } catch (error) {
                          console.error("[v0] Error sending notification:", error)
                          alert("Failed to send notification")
                        }
                      }}
                      variant="outline"
                    >
                      Send Notification
                    </Button>
                  )}
                  <Button onClick={() => setShowEditModal(false)} variant="outline">
                    Close
                  </Button>
                  <Button 
                    onClick={handleSaveEdit} 
                    disabled={savingEdit}
                    className="bg-[#D76B1A] text-white"
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Appointment Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader className="border-b border-[#F7E2BD]">
              <div className="flex items-center justify-between">
                <CardTitle>Schedule New Appointment</CardTitle>
                <button onClick={() => setShowNewForm(false)} className="p-2 hover:bg-[#F7E2BD] rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Title *</Label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  placeholder="e.g., Home check for Max"
                />
              </div>

              <div>
                <Label>Appointment Type</Label>
                <select
                  value={formData.appointment_type}
                  onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                >
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time *</Label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  />
                </div>
                <div>
                  <Label>End Time *</Label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dog (optional)</Label>
                  <select
                    value={formData.dog_id}
                    onChange={(e) => handleDogChange(e.target.value)}
                    className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  >
                    <option value="">Select dog...</option>
                    {dogs.map((dog) => (
                      <option key={dog.id} value={dog.id}>
                        {dog.name} ({dog.breed})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Foster (optional)</Label>
                  <select
                    value={formData.foster_id}
                    onChange={(e) => setFormData({ ...formData, foster_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  >
                    <option value="">Select foster...</option>
                    {fosters.map((foster) => (
                      <option key={foster.id} value={foster.id}>
                        {foster.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Team (optional)</Label>
                <select
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                >
                  <option value="">Select team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Location</Label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  placeholder="e.g., Vet clinic, foster home"
                />
              </div>

              <div>
                <Label>Items Needed (comma-separated)</Label>
                <input
                  type="text"
                  value={formData.items_needed}
                  onChange={(e) => setFormData({ ...formData, items_needed: e.target.value })}
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  placeholder="e.g., Medical records, leash, carrier"
                />
              </div>

              <div>
                <Label>Description</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  rows={3}
                  placeholder="Additional details about the appointment..."
                />
              </div>

              <div>
                <Label>Notes</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-[#F7E2BD] rounded-lg"
                  rows={2}
                  placeholder="Internal notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#F7E2BD]">
                <Button onClick={() => setShowNewForm(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleCreateAppointment} disabled={saving} className="bg-[#D76B1A] text-white">
                  {saving ? "Scheduling..." : "Schedule Appointment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
