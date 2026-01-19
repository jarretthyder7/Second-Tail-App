export type OnboardingStep = {
  id: string
  title: string
  description: string
  targetPath: string
  category: "setup" | "animals" | "fosters" | "teams" | "communication" | "scheduling"
  order: number
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "complete-org-profile",
    title: "Complete your organization profile",
    description: "Add your organization's contact information and address so fosters can reach you",
    targetPath: "/settings",
    category: "setup",
    order: 1,
  },
  {
    id: "customize-dashboard",
    title: "Customize your dashboard",
    description: "Add sections to your dashboard to see what matters most at a glance",
    targetPath: "/dashboard",
    category: "setup",
    order: 2,
  },
  {
    id: "create-first-dog",
    title: "Add your first animal",
    description: "Create a profile for an animal in your care so you can track their progress",
    targetPath: "/dogs",
    category: "animals",
    order: 3,
  },
  {
    id: "invite-first-foster",
    title: "Invite a foster",
    description: "Send an invitation to a foster parent to join your organization",
    targetPath: "/fosters",
    category: "fosters",
    order: 4,
  },
  {
    id: "assign-dog-to-foster",
    title: "Assign an animal to a foster",
    description: "Match an animal with a foster parent to start tracking their care",
    targetPath: "/dogs",
    category: "fosters",
    order: 5,
  },
  {
    id: "create-first-team",
    title: "Set up your first team",
    description: "Organize your rescue staff into teams like Medical, Transport, or Adoption",
    targetPath: "/teams",
    category: "teams",
    order: 6,
  },
  {
    id: "send-first-message",
    title: "Send a message to a foster",
    description: "Open a conversation with a foster to see how communication works",
    targetPath: "/messages",
    category: "communication",
    order: 7,
  },
  {
    id: "schedule-first-appointment",
    title: "Schedule an appointment",
    description: "Create your first appointment with a foster for a home check or vet visit",
    targetPath: "/appointments",
    category: "scheduling",
    order: 8,
  },
]

export function getNextStep(completedSteps: string[]): OnboardingStep | null {
  return ONBOARDING_STEPS.find((step) => !completedSteps.includes(step.id)) || null
}

export function getStepsByCategory(category: OnboardingStep["category"]): OnboardingStep[] {
  return ONBOARDING_STEPS.filter((step) => step.category === category)
}

export function getProgressPercentage(completedSteps: string[]): number {
  return Math.round((completedSteps.length / ONBOARDING_STEPS.length) * 100)
}
