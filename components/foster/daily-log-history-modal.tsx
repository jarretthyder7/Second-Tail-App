"use client"
import { useState } from "react"
import { X, ChevronDown, ChevronUp } from "lucide-react"

interface DailyLog {
  id: string
  date: string
  category: string
  notes: string
  mood: "rough" | "ok" | "great"
}

interface DailyLogHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  logs: DailyLog[]
}

export function DailyLogHistoryModal({ isOpen, onClose, logs }: DailyLogHistoryModalProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  if (!isOpen) return null

  const getMoodColor = (mood: string) => {
    if (mood === "rough") return "bg-[#D97A68] text-white"
    if (mood === "great") return "bg-[#E8EFE6] text-[#5A4A42]"
    return "bg-[#F7E2BD] text-[#5A4A42]"
  }

  const getMoodLabel = (mood: string) => {
    return mood === "rough" ? "Rough" : mood === "great" ? "Great" : "OK"
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto md:max-h-[80vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-gray-900">Daily Log History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {!logs || logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No logs yet. Start tracking your foster animal's journey!</p>
            </div>
          ) : (
            logs.map((log) => (
              <button
                key={log.id}
                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition border-l-4 border-primary-orange"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">{log.category}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(log.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getMoodColor(log.mood)}`}
                    >
                      {getMoodLabel(log.mood)}
                    </span>
                    {expandedLogId === log.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedLogId === log.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-700 text-sm leading-relaxed">{log.notes}</p>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
