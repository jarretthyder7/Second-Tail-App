"use client"

import { useEffect, useState } from "react"
import { SETUP_STEPS } from "@/lib/setup-steps"
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

type SetupStatusSidebarProps = {
  orgId: string
}

export function SetupStatusSidebar({ orgId }: SetupStatusSidebarProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSetupStatus()
  }, [orgId])

  const loadSetupStatus = async () => {
    try {
      const response = await fetch(`/api/admin/setup-status?orgId=${orgId}`)
      if (!response.ok) throw new Error("Failed to fetch setup status")
      const data = await response.json()
      setCompletedSteps(data.completedSteps)
    } catch (error) {
      console.error("[v0] Error loading setup status:", error)
    } finally {
      setLoading(false)
    }
  }

  const completionPercentage = Math.round((completedSteps.length / SETUP_STEPS.length) * 100)

  if (loading) return null
  // Remove setup sidebar after onboarding is complete
  if (completionPercentage === 100) return null

  return (
    <div className="bg-white rounded-xl border-2 border-[#F7E2BD] p-4">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[#5A4A42] text-sm">Setup Status</h3>
          <p className="text-xs text-[#2E2E2E]/60">{completionPercentage}% complete</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#D76B1A]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#D76B1A]" />
        )}
      </button>

      <div className="h-2 bg-[#F7E2BD] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-[#D76B1A] to-[#B85A15] transition-all"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {isExpanded && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {SETUP_STEPS.map((step) => {
            const isComplete = completedSteps.includes(step.id)
            return (
              <Link
                key={step.id}
                href={step.targetPath ? `/org/${orgId}/admin${step.targetPath}` : "#"}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#FBF8F4] transition text-xs"
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-[#D76B1A] flex-shrink-0" />
                )}
                <span className={isComplete ? "text-[#2E2E2E]/50 line-through" : "text-[#5A4A42]"}>{step.title}</span>
              </Link>
            )
          })}

          <Link
            href={`/org/${orgId}/admin/setup-wizard`}
            className="flex items-center justify-center gap-2 mt-3 p-2 rounded-lg bg-[#D76B1A]/10 text-[#D76B1A] hover:bg-[#D76B1A]/20 transition font-medium text-xs"
          >
            View All Steps →
          </Link>
        </div>
      )}
    </div>
  )
}
