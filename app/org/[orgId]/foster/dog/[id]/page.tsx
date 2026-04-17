"use client"

import type React from "react"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { ProtectedRoute } from "@/lib/protected-route"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  MessageCircle,
  Calendar,
  Heart,
  Stethoscope,
  Dog,
  ChevronRight,
  Pill,
  AlertTriangle,
  FileText,
  User,
  Building2,
} from "lucide-react"

function FosterDogProfilePage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const dogId = params.id as string

  const [dog, setDog] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [timelineEvents, setTimelineEvents] = useState<any[]>([])
  const [carePlan, setCarePlan] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "journey" | "medical" | "behavior" | "messages">("overview")
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // Fetch dog data
        const { data: dogData, error: dogError } = await supabase.from("dogs").select("*").eq("id", dogId).single()

        if (dogError) throw new Error(dogError.message)
        if (!dogData) throw new Error("Dog not found")

        setDog(dogData)

        // Fetch organization
        if (dogData.organization_id) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", dogData.organization_id)
            .single()
          setOrganization(orgData)
        }

        // Fetch daily logs
        const { data: logsData } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("dog_id", dogId)
          .order("created_at", { ascending: false })
        setLogs(logsData || [])

        // Fetch timeline events (only visible_to_foster = true)
        const { data: eventsData } = await supabase
          .from("timeline_events")
          .select("*")
          .eq("animal_id", dogId)
          .eq("visible_to_foster", true)
          .order("event_date", { ascending: false })
        setTimelineEvents(eventsData || [])

        // Fetch care plan
        const { data: carePlanData } = await supabase.from("care_plans").select("*").eq("dog_id", dogId).single()
        setCarePlan(carePlanData)

        // Fetch upcoming appointments
        const { data: appointmentsData } = await supabase
          .from("appointments")
          .select("*")
          .eq("dog_id", dogId)
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(3)
        setAppointments(appointmentsData || [])

        // Fetch conversations for this dog
        const { data: conversationsData } = await supabase
          .from("conversations")
          .select("*, messages(*), teams(name, description)")
          .eq("dog_id", dogId)
          .order("updated_at", { ascending: false })

        let enrichedConversations = conversationsData || []
        if (enrichedConversations.length > 0) {
          const staffIds = enrichedConversations
            .map((c) => c.recipient_id)
            .filter((id, idx, arr) => id && arr.indexOf(id) === idx)

          if (staffIds.length > 0) {
            const { data: staffData } = await supabase
              .from("profiles")
              .select("id, name, email, org_role")
              .in("id", staffIds)

            const staffMap = new Map(staffData?.map((s) => [s.id, s]) || [])
            enrichedConversations = enrichedConversations.map((c) => ({
              ...c,
              staff: staffMap.get(c.recipient_id),
            }))
          }
        }

        setConversations(enrichedConversations)
      } catch (err: any) {
        console.error("Error loading dog:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (dogId) {
      loadData()
    }
  }, [dogId])

  // Helper to get stage display name
  const getStageDisplay = (stage: string) => {
    const stages: Record<string, string> = {
      intake: "Intake",
      evaluation: "Evaluation",
      in_foster: "In Foster Care",
      available: "Available for Adoption",
      adoption_pending: "Adoption Pending",
      adopted: "Adopted",
      medical_hold: "Medical Hold",
      returned: "Returned to Rescue",
    }
    return stages[stage] || stage
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !dog) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          <div className="bg-card rounded-2xl shadow-sm p-8 text-center">
            <Dog className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Profile Unavailable</h2>
            <p className="text-muted-foreground mb-4">
              {error || "This profile doesn't exist or may have been removed."}
            </p>
            <Link
              href={`/org/${orgId}/foster/dashboard`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* LEFT COLUMN - Animal Summary (Always Visible) */}
          <div className="space-y-4">
            {/* Animal Photo & Basic Info Card */}
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              {/* Photo with reliable fallback */}
              <div className="aspect-square relative bg-muted">
                {!imageError && dog.image_url ? (
                  <img
                    src={dog.image_url || "/placeholder.svg"}
                    alt={dog.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <Dog className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                {/* Stage badge overlay */}
                <div className="absolute bottom-3 left-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-lg">
                    <Heart className="w-3 h-3" />
                    {getStageDisplay(dog.stage || "in_foster")}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Name, breed, age, sex */}
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{dog.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {dog.breed || "Mixed Breed"}
                    {dog.age && ` • ${dog.age} ${dog.age === 1 ? "year" : "years"} old`}
                    {dog.gender && ` • ${dog.gender}`}
                  </p>
                </div>

                {/* Intake date */}
                {dog.intake_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Intake:{" "}
                      {new Date(dog.intake_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {/* Rescue name */}
                {organization && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>via {organization.name}</span>
                  </div>
                )}

                {/* Primary CTA - Contact Rescue */}
                <Link
                  href={`/org/${orgId}/foster/messages`}
                  className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground px-4 py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact Rescue
                </Link>

                {/* Add Daily Update CTA */}
                <button
                  onClick={() => setActiveTab("overview")}
                  className="flex items-center justify-center gap-2 w-full bg-secondary text-secondary-foreground px-4 py-3 rounded-xl font-medium hover:bg-secondary/80 transition"
                >
                  <FileText className="w-4 h-4" />
                  Add Daily Update
                </button>
              </div>
            </div>

            {/* Upcoming Appointments Preview */}
            {appointments.length > 0 && (
              <div className="bg-card rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Upcoming
                </h3>
                <div className="space-y-2">
                  {appointments.slice(0, 2).map((apt) => (
                    <div key={apt.id} className="p-3 bg-secondary rounded-lg">
                      <p className="font-medium text-sm text-foreground">{apt.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(apt.start_time).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Tabbed Content */}
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-border px-4 pt-4">
              <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
                {[
                  { id: "overview", label: "Overview", icon: FileText },
                  { id: "journey", label: "Journey", icon: Heart },
                  { id: "medical", label: "Medical", icon: Stethoscope },
                  { id: "behavior", label: "Behavior", icon: Dog },
                  { id: "messages", label: "Messages", icon: MessageCircle },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <OverviewTab dog={dog} carePlan={carePlan} appointments={appointments} logs={logs} orgId={orgId} />
              )}

              {/* JOURNEY TAB */}
              {activeTab === "journey" && <JourneyTab dog={dog} timelineEvents={timelineEvents} />}

              {/* MEDICAL TAB */}
              {activeTab === "medical" && <MedicalTab dog={dog} carePlan={carePlan} />}

              {/* BEHAVIOR TAB */}
              {activeTab === "behavior" && <BehaviorTab dog={dog} />}

              {/* MESSAGES TAB */}
              {activeTab === "messages" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Messages with Rescue Team</h2>
                    <button
                      onClick={() => router.push(`/org/${orgId}/foster/messages`)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      New Message
                    </button>
                  </div>

                  {conversations.length === 0 ? (
                    <div className="bg-card rounded-lg p-8 text-center border border-border">
                      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">No messages yet</p>
                      <button
                        onClick={() => router.push(`/org/${orgId}/foster/messages`)}
                        className="text-primary hover:underline font-medium"
                      >
                        Start a conversation
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversations.map((conv: any) => (
                        <div
                          key={conv.id}
                          onClick={() => router.push(`/org/${orgId}/foster/messages?convId=${conv.id}`)}
                          className="bg-card rounded-lg p-4 border border-border hover:border-primary/50 hover:shadow-sm transition cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">
                                {conv.team ? `Team: ${conv.team}` : conv.staff?.name || "Unknown Staff"}
                              </h3>
                              {conv.staff && (
                                <p className="text-sm text-muted-foreground">
                                  {conv.staff.email} {conv.staff.org_role && `• ${conv.staff.org_role}`}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(conv.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          {conv.messages && conv.messages.length > 0 && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.messages[conv.messages.length - 1]?.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewTab({
  dog,
  carePlan,
  appointments,
  logs,
  orgId,
}: { dog: any; carePlan: any; appointments: any[]; logs: any[]; orgId: string }) {
  const [category, setCategory] = useState<string>("general")
  const [mood, setMood] = useState<"rough" | "ok" | "great">("ok")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notes.trim()) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      await supabase.from("daily_logs").insert({
        dog_id: dog.id,
        foster_id: user?.id,
        date: new Date().toISOString().split("T")[0],
        mood,
        behavior_notes: category === "behavior" ? notes : null,
        medical_notes: category === "health" ? notes : null,
      })

      // Send medical update email if health notes were added
      if (category === "health") {
        try {
          const { data: org } = await supabase
            .from("organizations")
            .select("id, name, email")
            .eq("id", dog.organization_id)
            .single()

          if (org) {
            const origin = window.location.origin
            await fetch(`${origin}/api/email/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "medical-update",
                fosterEmail: user?.email,
                fosterName: user?.user_metadata?.name || "Foster",
                dogName: dog.name,
                updateType: "health",
                notes: notes,
              }),
            })
          }
        } catch (emailError) {
          console.warn("Failed to send medical update email:", emailError)
        }
      }

      setShowSuccess(true)
      setNotes("")
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      console.error("Error submitting log:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const moodColors = {
    rough: "bg-red-100 text-red-700 border-red-200",
    ok: "bg-yellow-100 text-yellow-700 border-yellow-200",
    great: "bg-green-100 text-green-700 border-green-200",
  }

  return (
    <div className="space-y-6">
      {/* About Section */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">About {dog.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {dog.description ||
            `${dog.name} is a wonderful ${dog.breed || "dog"} currently in foster care. Check the Medical and Behavior tabs for more detailed information.`}
        </p>
      </div>

      {/* Quick Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Recent Appointment */}
        <div className="p-4 bg-secondary rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Next Appointment</span>
          </div>
          {appointments.length > 0 ? (
            <p className="text-sm font-semibold text-foreground">{appointments[0].title}</p>
          ) : (
            <p className="text-sm text-muted-foreground">None scheduled</p>
          )}
        </div>

        {/* Active Medications */}
        <div className="p-4 bg-secondary rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Pill className="w-4 h-4" />
            <span className="text-xs font-medium">Medications</span>
          </div>
          {carePlan?.medications && carePlan.medications.length > 0 ? (
            <p className="text-sm font-semibold text-foreground">{carePlan.medications.length} active</p>
          ) : (
            <p className="text-sm text-muted-foreground">None</p>
          )}
        </div>

        {/* Behavior Status */}
        <div className="p-4 bg-secondary rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Dog className="w-4 h-4" />
            <span className="text-xs font-medium">Behavior Notes</span>
          </div>
          {dog.behavior_notes ? (
            <p className="text-sm font-semibold text-foreground">See details</p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes shared</p>
          )}
        </div>
      </div>

      {/* Daily Update Form */}
      <div className="border border-border rounded-xl p-4">
        <h3 className="font-semibold text-foreground mb-4">Submit Daily Update</h3>
        <form onSubmit={handleSubmitLog} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="general">General</option>
              <option value="behavior">Behavior</option>
              <option value="health">Health</option>
            </select>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">How's {dog.name} doing?</label>
            <div className="flex gap-2">
              {(["rough", "ok", "great"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${
                    mood === m
                      ? moodColors[m] + " ring-2 ring-offset-2 ring-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {m === "rough" ? "Rough" : m === "ok" ? "OK" : "Great"}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`How is ${dog.name} doing today?`}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[100px]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !notes.trim()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Update"}
          </button>

          {showSuccess && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium text-center">
              Update submitted successfully!
            </div>
          )}
        </form>
      </div>

      {/* Recent Updates */}
      {logs.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3">Recent Updates</h3>
          <div className="space-y-3">
            {logs.slice(0, 3).map((log) => (
              <div key={log.id} className="p-4 bg-secondary rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${moodColors[log.mood as keyof typeof moodColors] || moodColors.ok}`}
                  >
                    {log.mood === "rough" ? "Rough Day" : log.mood === "great" ? "Great Day" : "OK Day"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {log.behavior_notes || log.medical_notes || "Update recorded"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function JourneyTab({ dog, timelineEvents }: { dog: any; timelineEvents: any[] }) {
  const getEventIcon = (type: string) => {
    const icons: Record<string, any> = {
      intake: Calendar,
      foster_assigned: Heart,
      foster_assignment: Heart,
      medical: Stethoscope,
      stage_change: ChevronRight,
      milestone: Heart,
    }
    return icons[type] || FileText
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">{dog.name}'s Journey</h3>
        <p className="text-sm text-muted-foreground mt-1">Key milestones and events shared by the rescue</p>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="text-center py-12 bg-secondary rounded-xl">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No journey events shared yet</p>
          <p className="text-sm text-muted-foreground mt-1">The rescue will add milestones as they happen</p>
        </div>
      ) : (
        <div className="space-y-3">
          {timelineEvents.map((event, index) => {
            const Icon = getEventIcon(event.type)
            return (
              <div key={event.id} className="relative">
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-border" />
                )}
                <div className="flex gap-4 p-4 bg-secondary rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{event.title}</h4>
                    {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>
                        {new Date(event.event_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-border">•</span>
                      <span>{event.created_by === "system" ? "Added by System" : "Added by Rescue"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MedicalTab({ dog, carePlan }: { dog: any; carePlan: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground">Medical Information</h3>
        <p className="text-sm text-muted-foreground mt-1">Health details shared by the rescue team</p>
      </div>

      {/* Medical Notes */}
      {dog.medical_notes ? (
        <div className="p-4 bg-secondary rounded-xl">
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            General Medical Notes
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{dog.medical_notes}</p>
        </div>
      ) : (
        <div className="p-4 bg-secondary rounded-xl text-center">
          <p className="text-muted-foreground">No medical notes have been shared yet</p>
        </div>
      )}

      {/* Medications */}
      {carePlan?.medications && carePlan.medications.length > 0 ? (
        <div className="p-4 bg-secondary rounded-xl">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            Current Medications
          </h4>
          <div className="space-y-3">
            {carePlan.medications.map((med: any, index: number) => (
              <div key={index} className="p-3 bg-background rounded-lg">
                <p className="font-medium text-foreground">{med.name}</p>
                {med.schedule && <p className="text-sm text-muted-foreground">Schedule: {med.schedule}</p>}
                {med.instructions && <p className="text-sm text-muted-foreground">Instructions: {med.instructions}</p>}
                {med.notes && <p className="text-sm text-muted-foreground mt-1">{med.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Feeding Schedule */}
      {carePlan?.feeding_schedule && (
        <div className="p-4 bg-secondary rounded-xl">
          <h4 className="font-medium text-foreground mb-2">Feeding Schedule</h4>
          <p className="text-sm text-muted-foreground">{carePlan.feeding_schedule}</p>
        </div>
      )}

      {/* Vet Info */}
      {(carePlan?.vet_clinic || carePlan?.vet_phone) && (
        <div className="p-4 bg-secondary rounded-xl">
          <h4 className="font-medium text-foreground mb-2">Veterinary Contact</h4>
          {carePlan.vet_clinic && <p className="text-sm text-muted-foreground">{carePlan.vet_clinic}</p>}
          {carePlan.vet_phone && <p className="text-sm text-muted-foreground">{carePlan.vet_phone}</p>}
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Medical Disclaimer</p>
            <p className="text-sm text-yellow-700 mt-1">
              Please contact the rescue before making any changes to medication or medical care.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function BehaviorTab({ dog }: { dog: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground">Behavior & Training</h3>
        <p className="text-sm text-muted-foreground mt-1">Guidance shared by the rescue team</p>
      </div>

      {dog.behavior_notes ? (
        <div className="p-4 bg-secondary rounded-xl">
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Dog className="w-4 h-4 text-primary" />
            Behavior Notes
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{dog.behavior_notes}</p>
        </div>
      ) : (
        <div className="text-center py-12 bg-secondary rounded-xl">
          <Dog className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No behavior notes have been shared yet</p>
          <p className="text-sm text-muted-foreground mt-1">The rescue will add guidance as needed</p>
        </div>
      )}
    </div>
  )
}

function MessagesTab({ dog, conversations, orgId }: { dog: any; conversations: any[]; orgId: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Messages about {dog.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">Communication with the rescue team</p>
      </div>

      <Link
        href={`/org/${orgId}/foster/messages`}
        className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
      >
        <MessageCircle className="w-4 h-4" />
        Open Messages
      </Link>

      {conversations.length === 0 ? (
        <div className="text-center py-12 bg-secondary rounded-xl">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start a conversation with the rescue team</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.slice(0, 3).map((conv) => (
            <Link
              key={conv.id}
              href={`/org/${orgId}/foster/messages`}
              className="block p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{conv.team || "Rescue Team"}</p>
                    <p className="text-xs text-muted-foreground">{conv.messages?.length || 0} messages</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={["foster"]}>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <FosterDogProfilePage />
      </Suspense>
    </ProtectedRoute>
  )
}
