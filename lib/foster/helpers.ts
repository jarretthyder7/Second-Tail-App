// Helper functions for foster portal conditional logic

export interface FosterProfile {
  id: string
  name: string | null
  email: string | null
  organization_id: string | null
  role: string
}

export interface FosterDog {
  id: string
  name: string
  status: string
}

/**
 * Check if a foster profile is complete (has name and email)
 */
export function isFosterProfileComplete(profile: FosterProfile | null): boolean {
  if (!profile) return false
  return !!(profile.name && profile.email)
}

/**
 * Check if foster has an organization connection
 */
export function hasOrgConnection(profile: FosterProfile | null): boolean {
  if (!profile) return false
  return !!profile.organization_id
}

/**
 * Determine which dashboard state to show based on profile status
 */
export type DashboardState = "incomplete-profile" | "no-org" | "waiting-assignment" | "active-foster"

export function getDashboardState(profile: FosterProfile | null, hasActiveDog: boolean): DashboardState {
  // State A: Profile incomplete
  if (!isFosterProfileComplete(profile)) {
    return "incomplete-profile"
  }

  // State B: Profile complete but no org connection
  if (!hasOrgConnection(profile)) {
    return "no-org"
  }

  // State D: Has active dog
  if (hasActiveDog) {
    return "active-foster"
  }

  // State C: Has org but waiting for dog assignment
  return "waiting-assignment"
}
