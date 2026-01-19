"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ChevronRight,
  Zap,
  Building2,
  Phone,
  Dog,
  Users,
  MessageSquare,
  Calendar,
  Clipboard,
} from "lucide-react"
import { SETUP_STEPS, getSetupProgress } from "@/lib/setup-steps"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Phone,
  Dog,
  Users,
  MessageSquare,
  Calendar,
  Clipboard,
}

export default function SetupWizardPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSetupStatus()
  }, [orgId])

  const loadSetupStatus = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("organization_setup_status")
      .select("setup_step_id")
      .eq("organization_id", orgId)
      .eq("is_completed", true)

    if (data) {
      setCompletedSteps(data.map((d) => d.setup_step_id))
    }
    setLoading(false)
  }

  const progress = getSetupProgress(completedSteps)
  const essentialSteps = SETUP_STEPS.filter((s) => s.category === "essential")
  const coordinateSteps = SETUP_STEPS.filter((s) => s.category === "coordinate")
  const configureSteps = SETUP_STEPS.filter((s) => s.category === "configure")

  const StepCard = ({ step }: { step: (typeof SETUP_STEPS)[0] }) => {
    const Icon = iconMap[step.icon]
    const isComplete = completedSteps.includes(step.id)

    return (
      <Link
        href={step.targetPath ? `/org/${orgId}/admin${step.targetPath}` : "#"}
        className={`block p-4 rounded-xl border-2 transition ${
          isComplete
            ? "border-green-200 bg-green-50/50"
            : "border-[#F7E2BD] hover:border-[#D76B1A] bg-white hover:bg-[#FBF8F4]"
        }`}
      >
        <div className="flex items-start gap-3">
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          ) : (
            <Circle className="w-6 h-6 text-[#D76B1A] flex-shrink-0 mt-1" />
          )}
          {Icon && <Icon className="w-6 h-6 text-[#D76B1A] flex-shrink-0 mt-1" />}

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${isComplete ? "text-gray-500 line-through" : "text-[#5A4A42]"}`}>
              {step.title}
            </h3>
            <p className={`text-sm mt-1 ${isComplete ? "text-gray-400" : "text-[#2E2E2E]/70"}`}>{step.description}</p>
            {step.estimatedTime && (
              <p className={`text-xs mt-2 ${isComplete ? "text-gray-300" : "text-[#2E2E2E]/50"}`}>
                Est. {step.estimatedTime}
              </p>
            )}
          </div>

          {!isComplete && <ChevronRight className="w-5 h-5 text-[#D76B1A] flex-shrink-0 mt-1" />}
        </div>
      </Link>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBF8F4]">
        <div className="text-[#5A4A42]">Loading setup wizard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF8F4] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href={`/org/${orgId}/admin/dashboard`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#D76B1A] hover:text-[#B85A15] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-[#F7E2BD] p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-[#D76B1A]/10">
              <Zap className="w-6 h-6 text-[#D76B1A]" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#5A4A42]">Setup Your Rescue Organization</h1>
              <p className="text-[#2E2E2E]/70 mt-1">
                Complete the essential steps to start coordinating with fosters and managing dogs
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#5A4A42]">Setup Progress</span>
              <span className="text-sm font-bold text-[#D76B1A]">{progress.percentage}%</span>
            </div>
            <div className="h-3 bg-[#F7E2BD] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D76B1A] to-[#B85A15] transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-[#2E2E2E]/60">
              {progress.completed} of {progress.total} steps completed
            </p>
          </div>
        </div>

        {/* Essential Steps */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#5A4A42] flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Essential Setup
            </h2>
            <p className="text-sm text-[#2E2E2E]/60 mt-1">Complete these first to enable core functionality</p>
          </div>
          <div className="grid gap-4">
            {essentialSteps.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </div>
        </div>

        {/* Coordinate Steps */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#5A4A42] flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Start Coordinating
            </h2>
            <p className="text-sm text-[#2E2E2E]/60 mt-1">Build connections with fosters and dogs</p>
          </div>
          <div className="grid gap-4">
            {coordinateSteps.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </div>
        </div>

        {/* Configure Steps */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#5A4A42] flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Advanced Configuration
            </h2>
            <p className="text-sm text-[#2E2E2E]/60 mt-1">Optimize your workflow and team management</p>
          </div>
          <div className="grid gap-4">
            {configureSteps.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
