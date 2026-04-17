"use client"

import { useState, useEffect } from "react"

import { createClient } from "@/lib/supabase/client"

const FileTextIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
)

const HeartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
)

interface JourneyEvent {
  id: string
  title: string
  description: string
  timestamp: string
  type: "assignment" | "log"
  mood?: string
}

interface JourneyTabProps {
  dog: any
}

export function JourneyTab({ dog }: JourneyTabProps) {
  const [events, setEvents] = useState<JourneyEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJourneyEvents = async () => {
      try {
        const supabase = createClient()

        const { data: logs, error: logsError } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("dog_id", dog.id)
          .order("date", { ascending: false })

        if (logsError) {
          setEvents([])
          setLoading(false)
          return
        }

        // Transform daily logs into journey events
        const journeyEvents: JourneyEvent[] = (logs || []).map((log) => ({
          id: log.id,
          title: `Daily Update - ${log.mood === "great" ? "Great Day!" : log.mood === "rough" ? "Rough Day" : "OK Day"}`,
          description: log.behavior_notes || log.medical_notes || "Foster update recorded",
          timestamp: log.date,
          type: "log",
          mood: log.mood,
        }))

        // Add an "assignment" event at the beginning to mark when fostering started
        if (dog.intake_date) {
          journeyEvents.push({
            id: "assignment-" + dog.id,
            title: `${dog.name} arrived for fostering`,
            description: `${dog.name} came home with their foster family on this date`,
            timestamp: dog.intake_date,
            type: "assignment",
          })
        }

        // Sort chronologically with oldest first
        journeyEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        setEvents(journeyEvents)
      } catch (err) {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchJourneyEvents()
  }, [dog.id, dog.intake_date])

  const getEventIcon = (type: string) => {
    return type === "assignment" ? <HeartIcon /> : <FileTextIcon />
  }

  const getEventIconColor = (type: string, mood?: string) => {
    if (type === "assignment") {
      return "bg-[#D76B1A] text-white"
    }
    if (mood === "rough") return "bg-[#D97A68] text-white"
    if (mood === "great") return "bg-[#E8EFE6] text-[#5A4A42]"
    return "bg-[#F7E2BD] text-[#5A4A42]"
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-[#2E2E2E]/60 text-sm">Loading journey...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold text-[#5A4A42]">{dog.name}'s Foster Journey</h4>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-[#2E2E2E]/60 text-sm">No journey events yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline connector line */}
              {index < events.length - 1 && <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-[#F7E2BD]" />}

              <div className="bg-white rounded-2xl shadow-sm p-4 relative">
                <div className="flex gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getEventIconColor(event.type, event.mood)}`}
                  >
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-semibold text-[#5A4A42] mb-1">{event.title}</h5>
                    {event.mood && (
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getEventIconColor("log", event.mood)}`}
                        >
                          {event.mood === "rough" ? "Rough Day" : event.mood === "great" ? "Great Day" : "OK Day"}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-[#2E2E2E] leading-relaxed mb-2">{event.description}</p>
                    <p className="text-xs text-[#2E2E2E]/60">
                      {new Date(event.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
