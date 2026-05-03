// Shared helpers for the org's per-day hours_of_operation JSONB.
// Schema (per scripts/add-hours-of-operation.sql):
//   { monday: { open: "09:00", close: "17:00", closed: false }, ... }
// Some legacy orgs may have a plain string in the column from when the admin
// settings page was a textarea; the helpers below handle both gracefully.

export type DayHours = {
  open: string | null
  close: string | null
  closed: boolean
}

export type HoursOfOperation = {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

export type DayKey = (typeof DAY_KEYS)[number]

export const DAY_LABELS: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

export const DEFAULT_HOURS_OF_OPERATION: HoursOfOperation = {
  monday: { open: "09:00", close: "17:00", closed: false },
  tuesday: { open: "09:00", close: "17:00", closed: false },
  wednesday: { open: "09:00", close: "17:00", closed: false },
  thursday: { open: "09:00", close: "17:00", closed: false },
  friday: { open: "09:00", close: "17:00", closed: false },
  saturday: { open: "10:00", close: "14:00", closed: false },
  sunday: { open: null, close: null, closed: true },
}

// Coerce whatever the DB hands us into a usable HoursOfOperation. Accepts:
// - Already-correct object → returned with missing days filled with defaults
// - null / undefined → returns DEFAULT_HOURS_OF_OPERATION
// - Legacy free-text string → returns DEFAULT (the string is too lossy to parse)
// - Stringified JSON → parsed and re-coerced
export function normalizeHours(raw: unknown): HoursOfOperation {
  if (!raw) return { ...DEFAULT_HOURS_OF_OPERATION }

  if (typeof raw === "string") {
    try {
      return normalizeHours(JSON.parse(raw))
    } catch {
      // Legacy free-text — can't reliably parse, fall back to defaults
      return { ...DEFAULT_HOURS_OF_OPERATION }
    }
  }

  if (typeof raw !== "object") return { ...DEFAULT_HOURS_OF_OPERATION }

  const result = { ...DEFAULT_HOURS_OF_OPERATION }
  const r = raw as Record<string, any>
  for (const day of DAY_KEYS) {
    const d = r[day]
    if (d && typeof d === "object") {
      result[day] = {
        open: typeof d.open === "string" ? d.open : null,
        close: typeof d.close === "string" ? d.close : null,
        closed: !!d.closed,
      }
    }
  }
  return result
}

// "09:00" → "9:00 AM"
export function formatTime12h(hhmm: string | null): string {
  if (!hhmm) return ""
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 || 12
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`
}

// Render the JSONB as a human-readable per-day string for foster-facing display.
// Returns lines like "Monday: 9:00 AM – 5:00 PM" or "Sunday: Closed".
// If passed a legacy free-text string (the old textarea value), passes it through.
export function formatHoursOfOperation(raw: unknown): string {
  if (!raw) return ""

  // Legacy: if it's a string that doesn't look like JSON, return as-is.
  if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (!trimmed.startsWith("{")) return trimmed
  }

  const hours = normalizeHours(raw)
  return DAY_KEYS.map((day) => {
    const d = hours[day]
    if (d.closed || !d.open || !d.close) {
      return `${DAY_LABELS[day]}: Closed`
    }
    return `${DAY_LABELS[day]}: ${formatTime12h(d.open)} – ${formatTime12h(d.close)}`
  }).join("\n")
}
