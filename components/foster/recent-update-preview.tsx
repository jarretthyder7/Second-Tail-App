"use client"
import { ChevronRight } from "lucide-react"

interface DailyLog {
  id: string
  date: string
  category: string
  notes: string
  mood: "rough" | "ok" | "great"
}

interface RecentUpdatePreviewProps {
  logs: DailyLog[]
  onViewHistory: () => void
}

export function RecentUpdatePreview({ logs, onViewHistory }: RecentUpdatePreviewProps) {
  if (!logs || logs.length === 0) {
    return null
  }

  const mostRecent = logs[0]

  const getMoodColor = (mood: string) => {
    if (mood === "rough") return "bg-[#D97A68] text-white"
    if (mood === "great") return "bg-[#E8EFE6] text-[#5A4A42]"
    return "bg-[#F7E2BD] text-[#5A4A42]"
  }

  const getMoodLabel = (mood: string) => {
    return mood === "rough" ? "Rough" : mood === "great" ? "Great" : "OK"
  }

  const truncatedNotes = mostRecent.notes.length > 150 ? mostRecent.notes.substring(0, 150) + "..." : mostRecent.notes

  return (
    <button
      onClick={onViewHistory}
      className="w-full text-left bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all group border-l-4 border-primary-orange"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Most Recent Update</p>
          <p className="text-gray-500 text-sm mt-1">
            {new Date(mostRecent.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getMoodColor(mostRecent.mood)}`}
        >
          {getMoodLabel(mostRecent.mood)}
        </span>
      </div>

      <div className="mb-4">
        <p className="font-semibold text-gray-900 capitalize mb-2">{mostRecent.category}</p>
        <p className="text-gray-700 text-sm leading-relaxed">{truncatedNotes}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 group-hover:text-primary-orange transition-colors">
        <span className="text-sm font-medium text-gray-600 group-hover:text-primary-orange">View Full History</span>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-orange" />
      </div>
    </button>
  )
}
