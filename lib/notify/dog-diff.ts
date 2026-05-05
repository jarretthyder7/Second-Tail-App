// Fields whose changes warrant emailing the assigned foster.
// Routine edits (weight, image_url, intake_date) are excluded — fosters don't
// need a ping every time an admin tweaks a record.
const MEANINGFUL_FIELDS = ["status", "medical_notes", "behavior_notes", "name"] as const

type MeaningfulField = (typeof MEANINGFUL_FIELDS)[number]

export type DogChange = {
  field: MeaningfulField
  before: unknown
  after: unknown
}

const FIELD_LABELS: Record<MeaningfulField, string> = {
  status: "Status",
  medical_notes: "Medical notes",
  behavior_notes: "Behavior notes",
  name: "Name",
}

export function diffDog(before: Record<string, unknown>, after: Record<string, unknown>): DogChange[] {
  const changes: DogChange[] = []
  for (const field of MEANINGFUL_FIELDS) {
    const a = before?.[field] ?? null
    const b = after?.[field] ?? null
    if (a !== b) changes.push({ field, before: a, after: b })
  }
  return changes
}

// Render changes for an email body. Long-text fields (notes) are summarized
// rather than dumped so the email stays scannable and we don't leak large
// medical histories to inboxes.
export function renderChangeSummary(changes: DogChange[]): string {
  return changes
    .map((c) => {
      const label = FIELD_LABELS[c.field]
      if (c.field === "medical_notes" || c.field === "behavior_notes") {
        return `<li><strong>${label}</strong> were updated</li>`
      }
      const before = c.before == null || c.before === "" ? "—" : String(c.before)
      const after = c.after == null || c.after === "" ? "—" : String(c.after)
      return `<li><strong>${label}</strong>: ${escape(before)} → ${escape(after)}</li>`
    })
    .join("")
}

export function plainChangeList(changes: DogChange[]): string {
  return changes.map((c) => FIELD_LABELS[c.field]).join(", ")
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
