"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import { SETUP_STEPS } from "@/lib/setup-steps"

type DashboardSetupWidgetProps = {
  orgId: string
}

export function DashboardSetupWidget({ orgId }: DashboardSetupWidgetProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSetupStatus()
  }, [orgId])

  const loadSetupStatus = async () => {
    try {
      const response = await fetch(`/api/admin/setup-status-auto?orgId=${orgId}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setCompletedSteps(data.completedSteps)
    } catch (error) {
      console.error("[v0] Error loading setup status:", error)
    } finally {
      setLoading(false)
    }
  }

  const completionPercentage = Math.round((completedSteps.length / SETUP_STEPS.length) * 100)
  const nextIncompleteStep = SETUP_STEPS.find((s) => !completedSteps.includes(s.id))
  const missingCount = SETUP_STEPS.length - completedSteps.length

  if (loading) return null
  // Remove widget after onboarding is complete
  if (completionPercentage === 100) return null

  return (
    <div className="bg-gradient-to-br from-[#FBF8F4] to-[#F7E2BD]/50 rounded-2xl border-2 border-[#D76B1A]/20 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[#D76B1A]/10">
          <Zap className="w-6 h-6 text-[#D76B1A]" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#5A4A42] flex items-center gap-2">
            Complete Your Setup
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </h2>
          <p className="text-[#2E2E2E]/70 mt-1">
            {missingCount} step{missingCount !== 1 ? "s" : ""} remaining to unlock all features
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-[#F7E2BD]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#5A4A42]">Progress</span>
          <span className="text-lg font-bold text-[#D76B1A]">{completionPercentage}%</span>
        </div>
        <div className="h-3 bg-[#F7E2BD] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D76B1A] to-[#B85A15] transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-xs text-[#2E2E2E]/60 mt-2">
          {completedSteps.length} of {SETUP_STEPS.length} steps completed
        </p>
      </div>

      {/* Next Step */}
      {nextIncompleteStep && (
        <div className="mb-6 p-4 bg-white border-l-4 border-[#D76B1A] rounded-lg">
          <p className="text-xs font-medium text-[#D76B1A] mb-1">Next Step</p>
          <h3 className="font-semibold text-[#5A4A42] mb-1">{nextIncompleteStep.title}</h3>
          <p className="text-sm text-[#2E2E2E]/70">{nextIncompleteStep.description}</p>
        </div>
      )}

      {/* Checklist Preview */}
      <div className="mb-6 space-y-2 max-h-40 overflow-y-auto">
        {SETUP_STEPS.slice(0, 3).map((step) => {
          const isComplete = completedSteps.includes(step.id)
          return (
            <div key={step.id} className="flex items-center gap-2 text-sm">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-[#D76B1A] flex-shrink-0" />
              )}
              <span className={isComplete ? "text-[#2E2E2E]/40 line-through" : "text-[#5A4A42]"}>{step.title}</span>
            </div>
          )
        })}
        {SETUP_STEPS.length > 3 && (
          <p className="text-xs text-[#D76B1A] font-medium pl-6">
            +{SETUP_STEPS.length - 3} more step{SETUP_STEPS.length - 3 !== 1 ? "s" : ""}...
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={nextIncompleteStep ? `/org/${orgId}/admin${nextIncompleteStep.targetPath || ""}` : `#`}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#D76B1A] text-white font-semibold rounded-lg hover:bg-[#B85A15] transition text-sm"
        >
          Start Next
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href={`/org/${orgId}/admin/setup-wizard`}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-[#D76B1A] text-[#D76B1A] font-semibold rounded-lg hover:bg-[#FBF8F4] transition text-sm"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
