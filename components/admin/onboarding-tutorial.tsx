"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter, usePathname } from "next/navigation"
import { X, CheckCircle2, Circle, ChevronRight, Sparkles } from "lucide-react"
import { ONBOARDING_STEPS, getNextStep, getProgressPercentage } from "@/lib/onboarding/steps"

export function OnboardingTutorial() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const orgId = params.orgId as string

  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [onboardingId, setOnboardingId] = useState<string | null>(null)

  useEffect(() => {
    loadOnboardingProgress()
  }, [orgId])

  const loadOnboardingProgress = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // Check if onboarding exists
    const { data: existing } = await supabase
      .from("onboarding_progress")
      .select("*")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      setOnboardingId(existing.id)
      setCompletedSteps(existing.completed_steps || [])
      setIsVisible(!existing.is_completed)
    } else {
      // Create new onboarding progress
      const { data: newProgress } = await supabase
        .from("onboarding_progress")
        .insert({
          organization_id: orgId,
          user_id: user.id,
          completed_steps: [],
          is_completed: false,
        })
        .select()
        .single()

      if (newProgress) {
        setOnboardingId(newProgress.id)
        setIsVisible(true)
      }
    }

    setLoading(false)
  }

  const markStepComplete = async (stepId: string) => {
    if (completedSteps.includes(stepId)) return

    const newCompletedSteps = [...completedSteps, stepId]
    setCompletedSteps(newCompletedSteps)

    const supabase = createClient()
    const isFullyCompleted = newCompletedSteps.length === ONBOARDING_STEPS.length

    await supabase
      .from("onboarding_progress")
      .update({
        completed_steps: newCompletedSteps,
        is_completed: isFullyCompleted,
        completed_at: isFullyCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", onboardingId)

    if (isFullyCompleted) {
      setTimeout(() => setIsVisible(false), 2000)
    }
  }

  const dismissTutorial = async () => {
    const supabase = createClient()
    await supabase
      .from("onboarding_progress")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", onboardingId)

    setIsVisible(false)
  }

  if (loading || !isVisible) return null

  const progress = getProgressPercentage(completedSteps)
  const nextStep = getNextStep(completedSteps)

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#F7E2BD] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#D76B1A] to-[#B85A15] text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-sm">Getting Started Guide</h3>
            </div>
            <button
              onClick={dismissTutorial}
              className="p-1 hover:bg-white/20 rounded-lg transition"
              title="Dismiss tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>
                {completedSteps.length} of {ONBOARDING_STEPS.length} completed
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {progress === 100 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="font-bold text-[#5A4A42] mb-2">All done!</h4>
              <p className="text-sm text-[#2E2E2E]/70">
                You've completed the setup guide. You're ready to manage your rescue!
              </p>
            </div>
          ) : isExpanded ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ONBOARDING_STEPS.map((step) => {
                const isComplete = completedSteps.includes(step.id)
                const isCurrent = nextStep?.id === step.id

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (!isComplete) {
                        router.push(`/org/${orgId}/admin${step.targetPath}`)
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? "border-[#D76B1A] bg-[#D76B1A]/5 shadow-sm"
                        : isComplete
                          ? "border-[#F7E2BD] bg-[#FBF8F4]"
                          : "border-[#F7E2BD] hover:border-[#D76B1A]/30 hover:bg-[#FBF8F4]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#2E2E2E]/30 flex-shrink-0 mt-0.5" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`font-semibold text-sm ${isComplete ? "text-[#2E2E2E]/60" : "text-[#5A4A42]"}`}
                          >
                            {step.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-xs font-medium text-[#D76B1A] bg-[#D76B1A]/10 px-2 py-0.5 rounded-full">
                              Next
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isComplete ? "text-[#2E2E2E]/40" : "text-[#2E2E2E]/70"}`}>
                          {step.description}
                        </p>
                      </div>

                      {!isComplete && <ChevronRight className="w-4 h-4 text-[#D76B1A] flex-shrink-0 mt-1" />}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-center text-sm text-[#D76B1A] hover:text-[#B85A15] font-medium"
            >
              Show steps
            </button>
          )}
        </div>

        {/* Footer */}
        {progress < 100 && isExpanded && (
          <div className="p-3 border-t border-[#F7E2BD] bg-[#FBF8F4]">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full text-center text-xs text-[#2E2E2E]/60 hover:text-[#2E2E2E] font-medium"
            >
              Minimize
            </button>
          </div>
        )}
      </div>

      {/* Hidden trigger for marking steps complete - you can call this via window.markOnboardingStepComplete() */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.markOnboardingStepComplete = (stepId) => { 
            window.dispatchEvent(new CustomEvent('complete-onboarding-step', { detail: { stepId } }));
          }`,
        }}
      />
    </div>
  )
}

// Hook to mark steps as complete from any page
export function useOnboardingStep(stepId: string) {
  useEffect(() => {
    const handleComplete = (e: CustomEvent) => {
      if (e.detail.stepId === stepId) {
        // Step completion logic handled by the OnboardingTutorial component
      }
    }

    window.addEventListener("complete-onboarding-step" as any, handleComplete)
    return () => window.removeEventListener("complete-onboarding-step" as any, handleComplete)
  }, [stepId])
}
