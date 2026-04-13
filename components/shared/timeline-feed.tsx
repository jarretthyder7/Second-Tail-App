"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface TimelineItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  isInternal?: boolean
  mood?: "rough" | "ok" | "great"
  teamBadge?: string
  authorName?: string
}

interface TimelineFeedProps {
  dogId: string
  viewerRole: "admin" | "foster"
  showComposer?: boolean
  onAddItem?: (item: Partial<TimelineItem>) => Promise<void>
}

export function TimelineFeed({ dogId, viewerRole, showComposer = false, onAddItem }: TimelineFeedProps) {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [composerOpen, setComposerOpen] = useState(false)
  const [newItemText, setNewItemText] = useState("")
  const [isInternal, setIsInternal] = useState(false)

  useEffect(() => {
    const fetchTimeline = async () => {
      const supabase = createClient()

      // Fetch daily logs as timeline events
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("dog_id", dogId)
        .order("created_at", { ascending: false })
      

      // Transform logs into timeline items
      const timelineItems: TimelineItem[] = (logs || []).map((log) => ({
        id: log.id,
        type: "log",
        title: `Daily Log: ${log.category || "Update"}`,
        description: log.notes || "",
        timestamp: log.created_at,
        mood: log.mood,
        isInternal: false,
      }))

      setItems(timelineItems)
      setLoading(false)
    }

    fetchTimeline()
  }, [dogId])

  const getEventIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      intake: "📥",
      assigned: "👤",
      log: "📝",
      "help-request": "🆘",
      "help-request-resolved": "✅",
      message: "💬",
      "vet-visit": "🏥",
      "status-change": "🔄",
      "care-plan-change": "📋",
      internal: "🔒",
      update: "📣",
    }
    return iconMap[type] || "•"
  }

  const getEventIconColor = (type: string) => {
    const colorMap: Record<string, string> = {
      intake: "bg-[#D76B1A] text-white",
      assigned: "bg-[#5A4A42] text-white",
      log: "bg-[#F7E2BD] text-[#5A4A42]",
      "help-request": "bg-[#D97A68] text-white",
      "help-request-resolved": "bg-[#E8EFE6] text-[#5A4A42]",
      message: "bg-[#D76B1A]/20 text-[#D76B1A]",
      "vet-visit": "bg-[#E8EFE6] text-[#5A4A42]",
      "status-change": "bg-[#5A4A42] text-white",
      "care-plan-change": "bg-[#E8EFE6] text-[#5A4A42]",
      internal: "bg-[#F7E2BD]/60 text-[#5A4A42] border-2 border-dashed border-[#5A4A42]/30",
      update: "bg-[#D76B1A] text-white",
    }
    return colorMap[type] || "bg-[#F7E2BD] text-[#5A4A42]"
  }

  const handleSubmit = async () => {
    if (!newItemText.trim() || !onAddItem) return

    await onAddItem({
      type: "update",
      description: newItemText,
      isInternal: viewerRole === "admin" ? isInternal : false,
    })

    setNewItemText("")
    setIsInternal(false)
    setComposerOpen(false)
  }

  // Filter internal items for foster view
  const filteredItems = viewerRole === "foster" ? items.filter((item) => !item.isInternal) : items

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-[#2E2E2E]/60 text-sm">Loading timeline...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Composer (Admin only) */}
      {viewerRole === "admin" && showComposer && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          {!composerOpen ? (
            <button
              onClick={() => setComposerOpen(true)}
              className="w-full flex items-center justify-center gap-2 text-[#5A4A42] py-3 rounded-xl border-2 border-dashed border-[#F7E2BD] hover:border-[#D76B1A] hover:bg-[#F7E2BD]/20 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Add Timeline Update</span>
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="What's the update?"
                className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 resize-none min-h-[100px]"
                autoFocus
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[#5A4A42] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]"
                  />
                  <span>Internal only (hidden from foster)</span>
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setComposerOpen(false)
                      setNewItemText("")
                      setIsInternal(false)
                    }}
                    className="px-4 py-2 text-sm font-medium text-[#5A4A42] hover:bg-[#F7E2BD]/40 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!newItemText.trim()}
                    className="px-4 py-2 text-sm font-medium bg-[#D76B1A] text-white rounded-lg hover:bg-[#C25E15] transition disabled:opacity-50"
                  >
                    Post Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-[#2E2E2E]/60 text-sm">No timeline events yet</p>
          {viewerRole === "admin" && (
            <p className="text-[#2E2E2E]/50 text-xs mt-1">Add the first update using the composer above</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, index) => (
            <div key={item.id} className="relative">
              {index < filteredItems.length - 1 && (
                <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-[#F7E2BD]" />
              )}

              <div
                className={`bg-white rounded-2xl shadow-sm p-4 relative ${item.isInternal && viewerRole === "admin" ? "border-2 border-dashed border-[#5A4A42]/30" : ""}`}
              >
                <div className="flex gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getEventIconColor(item.type)}`}
                  >
                    {getEventIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-[#5A4A42] mb-1">{item.title}</h5>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {item.isInternal && viewerRole === "admin" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F7E2BD] text-[#5A4A42] border border-[#5A4A42]/30">
                              Internal Only
                            </span>
                          )}
                          {item.mood && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                item.mood === "rough"
                                  ? "bg-[#D97A68] text-white"
                                  : item.mood === "great"
                                    ? "bg-[#E8EFE6] text-[#5A4A42]"
                                    : "bg-[#F7E2BD] text-[#5A4A42]"
                              }`}
                            >
                              {item.mood === "rough" ? "Rough Day" : item.mood === "great" ? "Great Day" : "OK Day"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-[#2E2E2E] leading-relaxed mb-2">{item.description}</p>

                    <div className="flex items-center gap-2 text-xs text-[#2E2E2E]/60">
                      {item.authorName && <span>{item.authorName}</span>}
                      {item.authorName && <span>•</span>}
                      <span>
                        {new Date(item.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
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
