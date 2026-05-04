// Identifies platform-level admins — the small set of people who run Second Tail
// itself, distinct from per-org admins. Used to gate the rescue waitlist queue
// and any other site-wide tooling.
//
// Expects the env var PLATFORM_ADMIN_EMAILS as a comma-separated list of
// lowercased emails (e.g. "you@example.com,partner@example.com").

export function getPlatformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allow = getPlatformAdminEmails()
  return allow.includes(email.toLowerCase())
}
