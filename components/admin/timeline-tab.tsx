"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Heart,
  Activity,
  FileText,
  User,
  ArrowLeftRight,
  Home,
} from "lucide-react"
import { addTimelineEvent } from "@/lib/timeline-helper"
import { useToast } from "@/hooks/use-toast"

interface TimelineEvent {
  id: string
  animal_id: string
  type: string
  title: string
  description: string
  visible_to_foster: boolean
  created_at: string
  event_date: string
  created_by: string
  metadata?: any
}

interface TimelineTabProps {
  dogId: string
  orgId: string
}

export default function TimelineTab({ dogId, orgId }: TimelineTabProps) {
  const { toast } = useToast()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [showComposer, setShowComposer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "note" as string,
    visible_to_foster: true,
    event_date: new Date().toISOString().split("T")[0],
  })

  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [dogId, filterType])

  async function fetchEvents() {
    setLoading(true)
    try {
      let query = supabase
        .from("timeline_events")
        .select("*")
        .eq("animal_id", dogId)
        .order("event_date", { ascending: false })

      if (filterType !== "all") {
        query = query.eq("type", filterType)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching timeline events:", error)
        throw error
      }
      console.log("[v0] Loaded timeline events:", data?.length || 0)
      setEvents(data || [])
    } catch (error) {
      console.error("[v0] Error fetching timeline events:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddEvent() {
    console.log("[v0] handleAddEvent called with:", newEvent)
    
    // Visual debug - show alert to confirm handler is called
    // alert("[v0 Debug] handleAddEvent was called! Title: " + newEvent.title)
    
    if (!newEvent.title.trim()) {
      console.log("[v0] Title is empty, returning early")
      toast({
        title: "Title required",
        description: "Please enter a title for the timeline entry.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add timeline entries.",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      const eventDate = new Date(newEvent.event_date)
      eventDate.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues

      const savedEvent = await addTimelineEvent({
        animal_id: dogId,
        type: newEvent.event_type as any,
        title: newEvent.title,
        description: newEvent.description,
        visible_to_foster: newEvent.visible_to_foster,
        created_by: user.id,
        event_date: eventDate.toISOString(),
      })

      // Immediately add the new event to the top of the list
      setEvents((prev) => [savedEvent, ...prev])

      setNewEvent({
        title: "",
        description: "",
        event_type: "note",
        visible_to_foster: true,
        event_date: new Date().toISOString().split("T")[0],
      })
      setShowComposer(false)

      toast({
        title: "Timeline entry added",
        description: "The entry has been saved successfully.",
      })
    } catch (error: any) {
      console.error("[v0] Error adding timeline event:", error?.message || JSON.stringify(error))
      toast({
        title: "Error",
        description: error?.message || "Failed to add timeline entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const eventTypeIcons: Record<string, any> = {
    intake: Home,
    status_change: Activity,
    foster_assignment: User,
    foster_assigned: User, // Add alias for foster_assigned event type
    foster_change: ArrowLeftRight, // Add foster_change event type
    foster_return: ArrowLeftRight,
    foster_ended: ArrowLeftRight, // Add foster_ended event type
    appointment: Calendar,
    medical: Heart,
    medical_update: Heart, // Add medical_update event type
    note: FileText,
    milestone: MapPin,
  }

  const eventTypeColors: Record<string, string> = {
    intake: "bg-green-100 text-green-700",
    status_change: "bg-blue-100 text-blue-700",
    foster_assignment: "bg-purple-100 text-purple-700",
    foster_assigned: "bg-purple-100 text-purple-700", // Add alias for foster_assigned
    foster_change: "bg-orange-100 text-orange-700", // Add foster_change color
    foster_return: "bg-orange-100 text-orange-700",
    foster_ended: "bg-orange-100 text-orange-700", // Add foster_ended color
    appointment: "bg-teal-100 text-teal-700",
    medical: "bg-red-100 text-red-700",
    medical_update: "bg-red-100 text-red-700", // Add medical_update color
    note: "bg-gray-100 text-gray-700",
    milestone: "bg-yellow-100 text-yellow-700",
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and add button */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-[#F7E2BD] rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">All Events</option>
            <option value="intake">Intake</option>
            <option value="status_change">Status Changes</option>
            <option value="foster_assignment">Foster Assignments</option>
            <option value="foster_return">Foster Returns</option>
            <option value="appointment">Appointments</option>
            <option value="medical">Medical</option>
            <option value="note">Notes</option>
            <option value="milestone">Milestones</option>
            <option value="foster_assigned">Foster Assigned</option>
            <option value="foster_change">Foster Change</option>
            <option value="medical_update">Medical Update</option>
          </select>
        </div>

        <button
          onClick={() => setShowComposer(!showComposer)}
          className="flex items-center gap-2 px-4 py-2 bg-[#D76B1A] text-white rounded-lg hover:bg-[#D76B1A]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Timeline Entry
        </button>
      </div>

      {/* Manual entry composer */}
      {showComposer && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAddEvent()
          }}
          className="bg-white border border-[#F7E2BD] rounded-2xl p-4 space-y-4 shadow-sm"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5A4A42] mb-1">Event Type</label>
              <select
                value={newEvent.event_type}
                onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                className="w-full border border-[#F7E2BD] rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="note">Note</option>
                <option value="intake">Intake</option>
                <option value="status_change">Status Change</option>
                <option value="foster_assignment">Foster Assignment</option>
                <option value="foster_return">Foster Return</option>
                <option value="appointment">Appointment</option>
                <option value="medical">Medical</option>
                <option value="milestone">Milestone</option>
                <option value="foster_assigned">Foster Assigned</option>
                <option value="foster_change">Foster Change</option>
                <option value="medical_update">Medical Update</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5A4A42] mb-1">Event Date</label>
              <input
                type="date"
                value={newEvent.event_date}
                onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                className="w-full border border-[#F7E2BD] rounded-lg px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-1">Title</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Event title..."
              className="w-full border border-[#F7E2BD] rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-1">Description</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Add details..."
              className="w-full border border-[#F7E2BD] rounded-lg px-3 py-2 text-sm resize-none min-h-[80px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="visible_to_foster"
              checked={newEvent.visible_to_foster}
              onChange={(e) => setNewEvent({ ...newEvent, visible_to_foster: e.target.checked })}
              className="rounded border-[#F7E2BD]"
            />
            <label htmlFor="visible_to_foster" className="text-sm text-[#5A4A42]">
              Visible to foster
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#D76B1A] text-white rounded-lg hover:bg-[#D76B1A]/90 transition-colors disabled:opacity-50 text-sm font-semibold"
            >
              {submitting ? "Adding..." : "Add Entry"}
            </button>
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              disabled={submitting}
              className="px-4 py-2 border border-[#5A4A42] text-[#5A4A42] rounded-lg hover:bg-[#F7E2BD]/40 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D76B1A]"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
          <p className="text-[#5A4A42]/60">No timeline events yet</p>
          <p className="text-sm text-[#5A4A42]/40 mt-1">Add the first entry to start tracking this animal's journey</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#F7E2BD]" />

          <div className="space-y-4">
            {events.map((event) => {
              const Icon = eventTypeIcons[event.type] || FileText
              const colorClass = eventTypeColors[event.type] || "bg-gray-100 text-gray-700"

              return (
                <div key={event.id} className="relative flex gap-4 pl-0">
                  {/* Icon */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${colorClass} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white rounded-2xl shadow-sm p-4 border border-[#F7E2BD]/50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-[#5A4A42]">{event.title}</h4>
                        <p className="text-xs text-[#5A4A42]/60 mt-0.5">
                          {formatEventDate(event.event_date || event.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.visible_to_foster ? (
                          <Eye className="w-4 h-4 text-green-500" title="Visible to foster" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" title="Hidden from foster" />
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                          {event.type.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-sm text-[#2E2E2E] mt-2 leading-relaxed">{event.description}</p>
                    )}
                    <p className="text-xs text-[#5A4A42]/40 mt-2">Added by {event.created_by}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
