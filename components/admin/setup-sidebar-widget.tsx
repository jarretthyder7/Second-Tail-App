"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight, CheckCircle2, Circle, AlertCircle, ChevronDown, X } from "lucide-react"
import { SETUP_STEPS, getSetupProgress } from "@/lib/setup-steps"

type SetupWidgetProps = {
  orgId: string
  initialCompletedSteps?: string[]
}

export function SetupSidebarWidget({ orgId, initialCompletedSteps = [] }: SetupWidgetProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>(initialCompletedSteps)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  // Fetch auto-detected setup status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/admin/setup-status-auto?orgId=${orgId}`)
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setCompletedSteps(data.completedSteps)
      } catch (error) {
        console.error("[v0] Error fetching setup status:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStatus()
  }, [orgId])

  const progress = getSetupProgress(completedSteps)
  const nextIncompleteStep = SETUP_STEPS.find((step) => !completedSteps.includes(step.id))

  if (isLoading || progress.percentage === 100 || isDismissed) {
    return null
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-[#D76B1A] shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center hover:bg-[#C25A0F] group"
        title="Open setup status"
      >
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-white">{progress.percentage}%</span>
          <span className="text-[10px] text-white/80 font-medium">Setup</span>
        </div>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-40">
      <div className="bg-white rounded-xl border border-[#F7E2BD] shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-[#F7E2BD] bg-gradient-to-r from-[#D76B1A]/10 to-transparent flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#D76B1A] flex-shrink-0" />
              <h3 className="font-semibold text-[#5A4A42]">Setup Status</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-white rounded transition-colors"
                title="Minimize"
              >
                <ChevronDown className="w-4 h-4 text-[#5A4A42]" />
              </button>
              {progress.percentage === 100 && (
                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-[#5A4A42]/60" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#5A4A42]">{progress.percentage}% Complete</span>
              <span className="text-xs text-[#5A4A42]/60">
                {progress.completed} of {progress.total}
              </span>
            </div>
            <div className="w-full bg-[#F7E2BD] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#D76B1A] h-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {/* Next Step Highlight */}
          {nextIncompleteStep && (
            <div className="p-4 border-b border-[#F7E2BD] bg-[#FBF8F4]">
              <p className="text-xs font-semibold text-[#5A4A42] mb-2">Next Step:</p>
              <Link
                href={`/org/${orgId}/admin${nextIncompleteStep.targetPath || ""}`}
                className="group flex items-start gap-3 p-3 bg-white rounded-lg border border-[#F7E2BD] hover:border-[#D76B1A] hover:bg-[#FBF8F4] transition"
              >
                <div className="mt-0.5">
                  <Circle className="w-5 h-5 text-[#D76B1A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#5A4A42] group-hover:text-[#D76B1A]">
                    {nextIncompleteStep.title}
                  </p>
                  <p className="text-xs text-[#5A4A42]/60 mt-1">{nextIncompleteStep.estimatedTime}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5A4A42]/30 group-hover:text-[#D76B1A] flex-shrink-0 mt-0.5" />
              </Link>
            </div>
          )}

          {/* All Steps List */}
          <div className="p-4 space-y-2">
            {SETUP_STEPS.map((step) => {
              const isCompleted = completedSteps.includes(step.id)
              return (
                <Link
                  key={step.id}
                  href={`/org/${orgId}/admin${step.targetPath || ""}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#FBF8F4] transition group"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#5A4A42]/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${isCompleted ? "text-[#5A4A42]/60 line-through" : "text-[#5A4A42]"}`}
                    >
                      {step.title}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
