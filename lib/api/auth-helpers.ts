/**
 * Shared checks for API routes. Used so we don't rely on the service-role key
 * for reads/writes that should match the logged-in user's permissions.
 */

export type ProfileForAccess = {
  id: string
  role: string
  organization_id: string | null
}

export type DogForAccess = {
  organization_id: string | null
  foster_id: string | null
}

/** Rescue staff in the dog's org, or the foster assigned to this dog. */
export function canAccessDog(profile: ProfileForAccess, dog: DogForAccess): boolean {
  if (profile.role === "rescue" && profile.organization_id && dog.organization_id === profile.organization_id) {
    return true
  }
  if (profile.role === "foster" && dog.foster_id === profile.id) {
    return true
  }
  return false
}

/** Logged-in rescue user who belongs to the given organization (from query/body). */
export function isRescueInOrg(profile: ProfileForAccess, orgId: string): boolean {
  return profile.role === "rescue" && profile.organization_id === orgId
}
