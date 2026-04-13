import { createClient } from "@/lib/supabase/client"

export type TimelineEventType =
  | "intake"
  | "status_change"
  | "foster_assigned"
  | "foster_ended"
  | "foster_assignment"
  | "foster_return"
  | "foster_change"
  | "appointment"
  | "appointment_scheduled"
  | "appointment_completed"
  | "medical"
  | "medical_update"
  | "note"
  | "milestone"
  | "file_uploaded"
  | "reimbursement_update"
  | "supply_request"
  | "internal_note_added"
  | "team_assignment"
  | "manual"

export interface TimelineEvent {
  id: string
  animal_id: string
  type: TimelineEventType
  title: string
  description?: string
  event_date: string
  created_by: string
  visible_to_foster: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export async function createTimelineEvent(event: Omit<TimelineEvent, "id" | "created_at" | "updated_at">) {
  const supabase = createClient()

  const insertData = {
    animal_id: event.animal_id,
    type: event.type,
    title: event.title,
    description: event.description || "",
    event_date: event.event_date || new Date().toISOString(),
    created_by: event.created_by,
    visible_to_foster: event.visible_to_foster,
    metadata: event.metadata || {},
  }

  const { data, error } = await supabase
    .from("timeline_events")
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating timeline event:", error)
    throw error
  }

  return data
}

export async function fetchTimelineEvents(animalId: string, viewerRole: "admin" | "foster" = "admin") {
  const supabase = createClient()

  let query = supabase
    .from("timeline_events")
    .select("*")
    .eq("animal_id", animalId)
    .order("event_date", { ascending: false })

  // Filter for foster view
  if (viewerRole === "foster") {
    query = query.eq("visible_to_foster", true)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching timeline events:", error)
    return []
  }

  return data as TimelineEvent[]
}

export const addTimelineEvent = createTimelineEvent
