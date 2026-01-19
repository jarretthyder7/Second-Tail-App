export type SetupStep = {
  id: string
  title: string
  description: string
  category: "essential" | "configure" | "coordinate"
  order: number
  icon: string
  targetPath?: string
  estimatedTime?: string
}

export const SETUP_STEPS: SetupStep[] = [
  {
    id: "org_profile",
    title: "Complete Organization Profile",
    description: "Add your organization's contact information, address, and phone numbers so fosters can reach you",
    category: "essential",
    order: 1,
    icon: "Building2",
    targetPath: "/settings",
    estimatedTime: "5 min",
  },
  {
    id: "help_settings",
    title: "Configure Support Options",
    description: "Set up emergency phone numbers, allowed supply types, and appointment scheduling",
    category: "essential",
    order: 2,
    icon: "Phone",
    targetPath: "/settings/help-requests",
    estimatedTime: "10 min",
  },
  {
    id: "first_dog",
    title: "Add Your First Animal",
    description: "Create a profile for an animal (dog, cat, rabbit, etc.) so fosters can start providing care",
    category: "coordinate",
    order: 3,
    icon: "PawPrint",
    targetPath: "/dogs",
    estimatedTime: "5 min",
  },
  {
    id: "invite_foster",
    title: "Invite a Foster Parent",
    description: "Send invitations to foster parents to expand your network",
    category: "coordinate",
    order: 4,
    icon: "Users",
    targetPath: "/fosters",
    estimatedTime: "5 min",
  },
  {
    id: "create_team",
    title: "Create Your First Team",
    description: "Organize staff into teams like Medical, Transport, or Adoption",
    category: "configure",
    order: 5,
    icon: "Users",
    targetPath: "/teams",
    estimatedTime: "10 min",
  },
  {
    id: "first_appointment",
    title: "Schedule First Appointment",
    description: "Create a home check or vet visit appointment with a foster",
    category: "coordinate",
    order: 6,
    icon: "Calendar",
    targetPath: "/appointments",
    estimatedTime: "5 min",
  },
]

export function getSetupByCategory(category: SetupStep["category"]): SetupStep[] {
  return SETUP_STEPS.filter((step) => step.category === category)
}

export function getSetupProgress(completedSteps: string[]): {
  total: number
  completed: number
  percentage: number
} {
  return {
    total: SETUP_STEPS.length,
    completed: completedSteps.length,
    percentage: Math.round((completedSteps.length / SETUP_STEPS.length) * 100),
  }
}
