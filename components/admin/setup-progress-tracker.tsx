"use client"

import { useEffect, useState } from "react"
import { AlertCircle, X } from "lucide-react"

type SetupProgressTrackerProps = {
  orgId: string
  onDismiss?: () => void
  isFloating?: boolean
}

export function SetupProgressTracker({ orgId, onDismiss, isFloating = false }: SetupProgressTrackerProps) {
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [missingCount, setMissingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    loadSetupStatus()
  }, [orgId])

  const loadSetupStatus = async () => {
    try {
      const response = await fetch(`/api/admin/setup-status?orgId=${orgId}`)
      if (!response.ok) throw new Error("Failed to fetch setup status")

      const data = await response.json()
      setCompletionPercentage(data.percentage)
      setMissingCount(data.total - data.completed)
    } catch (error) {
      console.error("[v0] Error loading setup status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    if (onDismiss) onDismiss()
  }

  // Don't show if dismissed or setup complete
  if (isDismissed || completionPercentage === 100 || loading) {
    return null
  }

  const containerClass = isFloating ? "fixed bottom-6 right-6 z-40 w-80 max-w-[calc(100vw-3rem)]" : "w-full"

  return (
    <div className={containerClass}>
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D76B1A] to-[#B85A15] text-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Setup Required</h3>
                <p className="text-xs opacity-90">
                  {missingCount} step{missingCount !== 1 ? "s" : ""} to complete
                </p>
              </div>
            </div>
            {onDismiss && (
              <button onClick={handleDismiss} className="p-1 hover:bg-white/20 rounded-lg transition flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 border-b border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#5A4A42]">Progress</span>
            <span className="text-sm font-bold text-[#D76B1A]">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-[#F7E2BD] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D76B1A] to-[#B85A15] transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Action */}
        <div className="p-4">
          <a
            href={`/org/${orgId}/admin/setup-wizard`}
            className="block w-full text-center px-4 py-2.5 bg-[#D76B1A] text-white font-semibold rounded-lg hover:bg-[#B85A15] transition text-sm"
          >
            Continue Setup
          </a>
        </div>
      </div>
    </div>
  )
}
