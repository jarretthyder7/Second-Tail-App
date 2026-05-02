"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { createClient } from "@/lib/supabase/client"
import {
  Upload,
  FileSpreadsheet,
  Dog,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react"

type ImportStep = "upload" | "detect" | "mapping" | "review" | "complete"
type ImportType = "animals" | "fosters"

type ColumnMapping = {
  sourceColumn: string
  targetField: string | null
}

type ParsedRow = {
  id: string
  data: Record<string, string>
  status: "ready" | "missing_info" | "needs_review" | "skipped"
  statusMessage?: string
  selected: boolean
  isDuplicate?: boolean
  // "exists" = already in DB; "in_sheet" = appears more than once in this upload
  duplicateReason?: "exists" | "in_sheet"
}

type FieldTier = "required" | "recommended" | "optional"

type FieldDef = {
  value: string
  label: string
  tier: FieldTier
  synonyms: string[]
  hint?: string
}

// Animal field options for mapping. Tiers: required (can't import without), recommended
// (builds a useful profile), optional (nice extras). `synonyms` covers common header variants
// from Shelterluv, PetPoint, RescueGroups, and generic spreadsheets so auto-mapping just works.
const animalFields: FieldDef[] = [
  { value: "name", label: "Animal Name", tier: "required", synonyms: ["name", "animal name", "pet name", "dog name", "cat name"] },

  { value: "species", label: "Species", tier: "recommended", synonyms: ["species", "animal type", "type", "animal species"], hint: "Dog, cat, etc." },
  { value: "breed", label: "Breed", tier: "recommended", synonyms: ["breed", "primary breed", "breed 1"] },
  { value: "age", label: "Age", tier: "recommended", synonyms: ["age", "age (years)", "age years", "age (months)", "age months"] },
  { value: "gender", label: "Gender", tier: "recommended", synonyms: ["gender", "sex"] },
  { value: "weight", label: "Weight", tier: "recommended", synonyms: ["weight", "weight (lbs)", "weight lbs", "weight in lbs"] },
  { value: "intake_date", label: "Intake Date", tier: "recommended", synonyms: ["intake date", "date of intake", "intake", "in date", "arrival date"] },
  { value: "stage", label: "Status/Stage", tier: "recommended", synonyms: ["status", "stage", "current status", "animal status"], hint: "Available, in foster, adopted, etc." },
  { value: "image_url", label: "Photo URL", tier: "recommended", synonyms: ["photo url", "photo", "image", "image url", "picture", "picture url", "primary photo", "primary photo url", "photos", "main photo", "thumbnail"], hint: "Link to the animal's photo — used as their profile picture." },

  { value: "medical_notes", label: "Medical Notes", tier: "optional", synonyms: ["medical notes", "medical", "vet notes", "health notes", "medical history"] },
  { value: "behavior_notes", label: "Behavior Notes", tier: "optional", synonyms: ["behavior notes", "behavior", "personality", "temperament", "behaviour notes"] },
  { value: "foster_name", label: "Current Foster (Name)", tier: "optional", synonyms: ["foster name", "current foster", "foster", "foster home", "foster parent", "foster current"] },
  { value: "foster_email", label: "Current Foster (Email)", tier: "optional", synonyms: ["foster email", "foster e-mail", "current foster email"] },
]

// Foster field options for mapping. Spreadsheets vary: some have one "Full Name" column,
// others split first + last. The first_name field accepts either — last_name is optional.
const fosterFields: FieldDef[] = [
  {
    value: "first_name",
    label: "First Name",
    tier: "required",
    synonyms: ["first name", "fname", "given name", "name", "foster name", "full name"],
    hint: "Map a single 'Full Name' column here if your sheet doesn't split first/last.",
  },
  { value: "email", label: "Email", tier: "required", synonyms: ["email", "e-mail", "email address"] },

  {
    value: "last_name",
    label: "Last Name",
    tier: "recommended",
    synonyms: ["last name", "surname", "family name", "lname"],
    hint: "Skip if your sheet only has one combined name column.",
  },
  { value: "phone", label: "Phone", tier: "recommended", synonyms: ["phone", "phone number", "mobile", "cell"] },
  { value: "city", label: "City", tier: "recommended", synonyms: ["city"] },
  { value: "state", label: "State", tier: "recommended", synonyms: ["state", "province"] },
  { value: "zip", label: "Zip Code", tier: "recommended", synonyms: ["zip", "zip code", "postal code", "postcode"] },

  { value: "status", label: "Approved Status", tier: "optional", synonyms: ["status", "approved", "approval status"] },
  { value: "notes", label: "Notes", tier: "optional", synonyms: ["notes", "comments", "description"] },
]

// Whitelist of `dogs` columns we'll actually insert. Anything else is ignored at import time
// (e.g. foster_name / foster_email need separate matching logic and aren't direct columns;
// internal_notes isn't a column on dogs today — folded into medical_notes if mapped).
const DOG_COLUMNS: string[] = [
  "name",
  "breed",
  "age",
  "gender",
  "weight",
  "species",
  "stage",
  "intake_date",
  "image_url",
  "medical_notes",
  "behavior_notes",
]

export default function ImportDataPage() {
  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <ImportDataContent />
    </ProtectedRoute>
  )
}

function ImportDataContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string

  const [currentStep, setCurrentStep] = useState<ImportStep>("upload")
  const [importType, setImportType] = useState<ImportType | null>(null)

  // Pre-select import type from URL param
  useEffect(() => {
    const typeParam = searchParams.get("type")
    if (typeParam === "animals" || typeParam === "fosters") {
      setImportType(typeParam)
    }
  }, [searchParams])
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<string[][]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [showIgnored, setShowIgnored] = useState(false)
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null)
  // Lowercased trimmed names (animals) or emails (fosters) already in this org — used to flag duplicates
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set())
  const [importResults, setImportResults] = useState<
    | {
        animals: number
        fosters: number
        failures: { name: string; reason: string }[]
      }
    | null
  >(null)
  const [error, setError] = useState<string | null>(null)

  // Parse a CSV string into rows. Handles quoted fields with embedded commas.
  const parseCSV = (content: string): string[][] => {
    const rows: string[][] = []
    let current = ""
    let row: string[] = []
    let inQuotes = false

    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      const next = content[i + 1]

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"'
          i++ // skip the escaped quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        row.push(current)
        current = ""
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        row.push(current)
        rows.push(row)
        row = []
        current = ""
        if (char === "\r" && next === "\n") i++ // swallow CRLF
      } else {
        current += char
      }
    }
    if (current.length > 0 || row.length > 0) {
      row.push(current)
      rows.push(row)
    }
    return rows
  }

  // Normalize a 2D grid into { headers, rows }: skip leading blank rows, trim, drop fully-empty
  // columns, fill blank header cells with placeholder names so the UI doesn't break.
  const normalizeGrid = (grid: string[][]): { headers: string[]; rows: string[][] } => {
    let headerIdx = 0
    while (headerIdx < grid.length && grid[headerIdx].every((c) => !String(c ?? "").trim())) {
      headerIdx++
    }
    if (headerIdx >= grid.length) return { headers: [], rows: [] }

    const rawHeader = grid[headerIdx].map((c) => String(c ?? "").trim())
    const dataRows = grid
      .slice(headerIdx + 1)
      .map((r) => r.map((c) => String(c ?? "").trim()))
      .filter((r) => r.some((c) => c !== ""))

    // Pad rows to header length
    const width = rawHeader.length
    const padded = dataRows.map((r) => {
      if (r.length === width) return r
      if (r.length < width) return [...r, ...Array(width - r.length).fill("")]
      return r.slice(0, width)
    })

    // Drop columns where the header is blank AND all data cells are blank
    const keep = rawHeader.map((h, i) => h !== "" || padded.some((r) => r[i] !== ""))
    const headers = rawHeader
      .map((h, i) => (h !== "" ? h : `Column ${i + 1}`))
      .filter((_, i) => keep[i])
    const rows = padded.map((r) => r.filter((_, i) => keep[i]))

    return { headers, rows }
  }

  // Parse any supported file type into a clean { headers, rows }.
  const parseSpreadsheet = async (uploadedFile: File): Promise<{ headers: string[]; rows: string[][] }> => {
    const lower = uploadedFile.name.toLowerCase()
    const isExcel = lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".xlsm")

    if (isExcel) {
      // Lazy-load xlsx so we don't ship ~900KB on every page load
      const XLSX = await import("xlsx")
      const buffer = await uploadedFile.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
      const firstSheet = workbook.SheetNames[0]
      if (!firstSheet) return { headers: [], rows: [] }
      const sheet = workbook.Sheets[firstSheet]
      const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: false,
        defval: "",
        blankrows: false,
      }) as unknown[][]
      const stringGrid = grid.map((r) => r.map((c) => (c == null ? "" : String(c))))
      return normalizeGrid(stringGrid)
    }

    const text = await uploadedFile.text()
    return normalizeGrid(parseCSV(text))
  }

  // Auto-detect column mappings using exact-then-fuzzy matching against the synonym table.
  const autoMapColumns = (parsedHeaders: string[], type: ImportType): ColumnMapping[] => {
    const fields = type === "fosters" ? fosterFields : animalFields
    const claimed = new Set<string>()

    // Build a lookup from normalized synonym -> field value
    const norm = (s: string) => s.toLowerCase().replace(/[_\-\s.()]+/g, " ").trim()
    const exactMap = new Map<string, string>()
    fields.forEach((f) => {
      f.synonyms.forEach((syn) => exactMap.set(norm(syn), f.value))
    })

    return parsedHeaders.map((header) => {
      const key = norm(header)
      let match: string | null = exactMap.get(key) ?? null

      if (!match) {
        // Fuzzy: header contains a synonym OR synonym contains the header
        for (const f of fields) {
          if (claimed.has(f.value)) continue
          if (f.synonyms.some((syn) => key.includes(norm(syn)) || norm(syn).includes(key))) {
            match = f.value
            break
          }
        }
      }

      // Don't claim the same target twice — second match falls back to skip
      if (match && claimed.has(match)) match = null
      if (match) claimed.add(match)

      return { sourceColumn: header, targetField: match }
    })
  }

  // Handle file upload
  const handleFileUpload = useCallback(
    async (uploadedFile: File) => {
      if (!importType) return
      setError(null)
      setFile(uploadedFile)
      setParsing(true)

      try {
        const { headers: parsedHeaders, rows } = await parseSpreadsheet(uploadedFile)

        if (parsedHeaders.length === 0) {
          setError(
            "We couldn't find any columns in that file. Make sure the first row contains column names (like 'Name', 'Breed', 'Intake Date') and try again.",
          )
          return
        }

        if (rows.length === 0) {
          setError("That file has headers but no data rows underneath. Add at least one row and re-upload.")
          return
        }

        setHeaders(parsedHeaders)
        setRawData(rows)
        setColumnMappings(autoMapColumns(parsedHeaders, importType))
        setCurrentStep("mapping")
      } catch (err) {
        console.error("Spreadsheet parse failed:", err)
        setError(
          "We couldn't read that file. It may be password-protected or corrupted. Try saving a fresh copy as .xlsx or .csv and re-upload.",
        )
      } finally {
        setParsing(false)
      }
    },
    [importType],
  )

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (!droppedFile) return
      const lower = droppedFile.name.toLowerCase()
      if (lower.endsWith(".csv") || lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".xlsm")) {
        handleFileUpload(droppedFile)
      } else {
        setError("Please upload a CSV or Excel file (.csv, .xlsx, .xls).")
      }
    },
    [handleFileUpload],
  )

  // Fetch the set of existing keys (dog names or foster emails) already in this org so we can
  // flag duplicates. Lowercased + trimmed for case-insensitive comparison. Best-effort — if the
  // fetch fails we just skip dup detection rather than blocking the import.
  const fetchExistingKeys = async (): Promise<Set<string>> => {
    const supabase = createClient()
    const keys = new Set<string>()
    try {
      if (importType === "animals") {
        const { data } = await supabase.from("dogs").select("name").eq("organization_id", orgId)
        data?.forEach((d: { name: string | null }) => {
          const k = d.name?.toLowerCase().trim()
          if (k) keys.add(k)
        })
      } else if (importType === "fosters") {
        const { data } = await supabase
          .from("invitations")
          .select("email")
          .eq("organization_id", orgId)
        data?.forEach((d: { email: string | null }) => {
          const k = d.email?.toLowerCase().trim()
          if (k) keys.add(k)
        })
      }
    } catch (err) {
      console.error("Failed to fetch existing keys for duplicate detection:", err)
    }
    return keys
  }

  // The dup-key for a row: name (animals) or email (fosters), lowercased + trimmed
  const rowKey = (data: Record<string, string>): string | null => {
    const raw = importType === "fosters" ? data.email : data.name
    const k = raw?.toLowerCase().trim()
    return k || null
  }

  // Process mappings and create preview rows
  const processDataForReview = async () => {
    const fields = importType === "fosters" ? fosterFields : animalFields
    const existing = await fetchExistingKeys()
    setExistingKeys(existing)

    // First pass — build rows, flag external duplicates (already in DB)
    const rows: ParsedRow[] = rawData.map((row, index) => {
      const data: Record<string, string> = {}
      const missingFields: string[] = []

      columnMappings.forEach((mapping, colIndex) => {
        if (mapping.targetField && row[colIndex] != null && row[colIndex].trim() !== "") {
          data[mapping.targetField] = row[colIndex].trim()
        }
      })

      fields
        .filter((f) => f.tier === "required")
        .forEach((field) => {
          if (!data[field.value] || data[field.value].trim() === "") {
            missingFields.push(field.label)
          }
        })

      const status: ParsedRow["status"] = missingFields.length > 0 ? "missing_info" : "ready"
      const statusMessage = missingFields.length > 0 ? `Missing: ${missingFields.join(", ")}` : ""
      const key = rowKey(data)
      const existsInDb = key != null && existing.has(key)

      return {
        id: `row-${index}`,
        data,
        status,
        statusMessage,
        selected: status === "ready" && !existsInDb,
        isDuplicate: existsInDb,
        duplicateReason: existsInDb ? "exists" : undefined,
      }
    })

    // Second pass — flag internal duplicates (same key appearing more than once in this upload).
    // First occurrence stays selected/ready; later occurrences get marked + deselected so the
    // unique-key constraint at insert time doesn't reject them silently.
    const firstSeenAt = new Map<string, number>()
    const dupKeyLabel = importType === "fosters" ? "email" : "name"
    rows.forEach((r, i) => {
      const key = rowKey(r.data)
      if (!key) return
      if (firstSeenAt.has(key)) {
        const firstIndex = firstSeenAt.get(key)!
        // External duplicates take priority — they need to be fixed regardless
        if (r.duplicateReason !== "exists") {
          r.isDuplicate = true
          r.duplicateReason = "in_sheet"
          r.statusMessage = `Same ${dupKeyLabel} as row ${firstIndex + 1} in your sheet`
        }
        r.selected = false
      } else {
        firstSeenAt.set(key, i)
      }
    })

    setParsedRows(rows)
    setCurrentStep("review")
  }

  // Convert a date string to ISO date (YYYY-MM-DD). Returns null if unparseable.
  const toIsoDate = (raw: string): string | null => {
    if (!raw) return null
    const trimmed = raw.trim()
    // Already ISO-ish?
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    const d = new Date(trimmed)
    if (isNaN(d.getTime())) return null
    return d.toISOString().split("T")[0]
  }

  // Map free-form stage values from spreadsheets (Shelterluv etc.) to canonical snake_case
  // values the dogs.stage column accepts. Unknown values fall through to "intake".
  const STAGE_ALIASES: Record<string, string> = {
    intake: "intake",
    "in-take": "intake",
    "intake-evaluation": "evaluation",
    evaluation: "evaluation",
    eval: "evaluation",
    available: "available",
    "available for adoption": "available",
    "adoption ready": "available",
    "in foster": "in_foster",
    in_foster: "in_foster",
    fostered: "in_foster",
    "foster home": "in_foster",
    "medical hold": "medical_hold",
    medical_hold: "medical_hold",
    "vet hold": "medical_hold",
    "behavioral hold": "medical_hold",
    "behavior hold": "medical_hold",
    "behavior eval": "evaluation",
    "on hold": "on_hold",
    on_hold: "on_hold",
    hold: "on_hold",
    quarantine: "on_hold",
    "pending adoption": "adoption_pending",
    adoption_pending: "adoption_pending",
    "adoption pending": "adoption_pending",
    "pending adopter": "adoption_pending",
    pending: "adoption_pending",
    adopted: "adopted",
    "in adopter home": "adopted",
    returned: "returned",
    "returned to shelter": "returned",
    rto: "returned",
    "stray hold": "intake",
    stray: "intake",
  }
  const normalizeStage = (raw: string | undefined): string => {
    const key = (raw || "").toLowerCase().trim()
    if (!key) return "intake"
    return STAGE_ALIASES[key] || "intake"
  }

  // Reduce gender to "male"/"female"; anything else returns null so we send NULL not garbage.
  const normalizeGender = (raw: string | undefined): string | null => {
    const key = (raw || "").toLowerCase().trim()
    if (!key) return null
    if (key === "m" || key.startsWith("male")) return "male"
    if (key === "f" || key.startsWith("female")) return "female"
    return null
  }

  // Best-effort species normalization. Unknown values pass through lowercased.
  const normalizeSpecies = (raw: string | undefined): string => {
    const key = (raw || "").toLowerCase().trim()
    if (!key) return "dog"
    if (key.startsWith("dog") || key === "k9" || key === "canine") return "dog"
    if (key.startsWith("cat") || key === "feline") return "cat"
    if (key.startsWith("rabbit") || key === "bunny") return "rabbit"
    if (key.startsWith("bird")) return "bird"
    return key
  }

  // Handle import — insert all mapped fields that map to known dogs columns.
  // Captures per-row failures so the user can see what didn't make it and why.
  const handleImport = async () => {
    setImporting(true)
    setError(null)

    const supabase = createClient()
    const selectedRows = parsedRows.filter((row) => row.selected && row.status !== "skipped")

    let animalsImported = 0
    let fostersImported = 0
    const failures: { name: string; reason: string }[] = []

    try {
      if (importType === "animals") {
        for (const row of selectedRows) {
          const displayName = row.data.name?.trim() || "Unnamed Animal"
          const insert: Record<string, unknown> = {
            organization_id: orgId,
            name: displayName,
            species: normalizeSpecies(row.data.species),
            stage: normalizeStage(row.data.stage),
            intake_date: toIsoDate(row.data.intake_date || "") || new Date().toISOString().split("T")[0],
          }

          // Pass through any additional mapped fields that map to real columns
          for (const col of DOG_COLUMNS) {
            if (col in insert) continue
            const val = row.data[col]
            if (val != null && val.trim() !== "") {
              if (col === "age" || col === "weight") {
                // dogs.age and dogs.weight are integer columns. parseInt handles "59.7" → 59,
                // "2 years" → 2, "55 lbs" → 55. Skip the field if there's no parseable number.
                const n = Number.parseInt(val.trim(), 10)
                if (!Number.isNaN(n)) insert[col] = n
              } else if (col === "gender") {
                const g = normalizeGender(val)
                if (g) insert[col] = g
              } else {
                insert[col] = val.trim()
              }
            }
          }

          const { error } = await supabase.from("dogs").insert(insert)
          if (!error) {
            animalsImported++
          } else {
            console.error("Animal insert failed:", error, insert)
            failures.push({ name: displayName, reason: error.message || "Unknown error" })
          }
        }
      }

      if (importType === "fosters") {
        // invitations.invited_by is NOT NULL — must be the current user's id
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setError("You're not signed in. Refresh and try again.")
          setImporting(false)
          return
        }

        // 12-char unique code per invitation (used in the signup link). Matches
        // generateInvitationCode in lib/supabase/queries.ts.
        const generateCode = () => {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
          let code = ""
          for (let i = 0; i < 12; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
          return code
        }

        for (const row of selectedRows) {
          const fullName = [row.data.first_name?.trim(), row.data.last_name?.trim()].filter(Boolean).join(" ")
          const displayName = fullName || row.data.email?.trim() || "Unknown"
          const { error } = await supabase.from("invitations").insert({
            organization_id: orgId,
            email: row.data.email?.trim(),
            status: "pending",
            invited_by: user.id,
            code: generateCode(),
          })

          if (!error) {
            fostersImported++
          } else {
            console.error("Foster invitation insert failed:", error)
            failures.push({ name: displayName, reason: error.message || "Unknown error" })
          }
        }
      }

      setImportResults({ animals: animalsImported, fosters: fostersImported, failures })
      setCurrentStep("complete")
    } catch (err) {
      console.error("Import failed:", err)
      setError("Import failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  // Assign a target field to a source column. If `sourceColumn` is null, clears the assignment.
  // If another column was previously assigned to this field, it gets unassigned (one-to-one mapping).
  const assignField = (targetField: string, sourceColumn: string | null) => {
    setColumnMappings((prev) =>
      prev.map((m) => {
        if (m.targetField === targetField && m.sourceColumn !== sourceColumn) {
          return { ...m, targetField: null }
        }
        if (sourceColumn && m.sourceColumn === sourceColumn) {
          return { ...m, targetField }
        }
        return m
      }),
    )
  }

  // Toggle row selection
  const toggleRowSelection = (rowId: string) => {
    setParsedRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, selected: !row.selected } : row)))
  }

  // Update a single cell, recompute row status, exit edit mode. If a row that was missing
  // required info just became ready (and isn't a duplicate), auto-select it.
  const updateCell = (rowId: string, field: string, value: string) => {
    const fields = importType === "fosters" ? fosterFields : animalFields
    const requiredKeys = fields.filter((f) => f.tier === "required").map((f) => f.value)
    const dupKeyField = importType === "fosters" ? "email" : "name"

    setParsedRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row
        const trimmed = value.trim()
        const newData = { ...row.data }
        if (trimmed === "") {
          delete newData[field]
        } else {
          newData[field] = trimmed
        }

        const missing: string[] = []
        requiredKeys.forEach((key) => {
          if (!newData[key] || newData[key].trim() === "") {
            const def = fields.find((f) => f.value === key)
            if (def) missing.push(def.label)
          }
        })

        const wasMissing = row.status === "missing_info"
        const newStatus: ParsedRow["status"] = missing.length > 0 ? "missing_info" : "ready"
        const becameReady = wasMissing && newStatus === "ready"

        // If the user edited the dup-key field, recheck both external (DB) and internal
        // (other rows in this upload) duplicates so the badge stays accurate.
        let isDuplicate = row.isDuplicate
        let duplicateReason = row.duplicateReason
        let dupStatusMessage = row.statusMessage

        if (field === dupKeyField) {
          const newKey = newData[dupKeyField]?.toLowerCase().trim()
          if (!newKey) {
            isDuplicate = false
            duplicateReason = undefined
          } else if (existingKeys.has(newKey)) {
            isDuplicate = true
            duplicateReason = "exists"
            dupStatusMessage = ""
          } else {
            // Look for the same key in OTHER rows of the upload
            const conflict = prev.find((other) => {
              if (other.id === rowId) return false
              const k = rowKey(other.data)
              return k === newKey
            })
            if (conflict) {
              const idx = prev.findIndex((o) => o.id === conflict.id)
              isDuplicate = true
              duplicateReason = "in_sheet"
              dupStatusMessage = `Same ${dupKeyField === "email" ? "email" : "name"} as row ${idx + 1} in your sheet`
            } else {
              isDuplicate = false
              duplicateReason = undefined
              dupStatusMessage = missing.length > 0 ? `Missing: ${missing.join(", ")}` : ""
            }
          }
        }

        return {
          ...row,
          data: newData,
          status: newStatus,
          statusMessage:
            missing.length > 0 ? `Missing: ${missing.join(", ")}` : duplicateReason === "in_sheet" ? dupStatusMessage : "",
          selected: row.selected || (becameReady && !isDuplicate),
          isDuplicate,
          duplicateReason,
        }
      }),
    )
    setEditingCell(null)
  }

  // Render a click-to-edit cell. Pass `options` for select-style fields, omit for free text.
  const editableCell = (
    rowId: string,
    field: string,
    value: string,
    options?: string[],
    extraClass = "",
  ) => {
    const isEditing = editingCell?.rowId === rowId && editingCell?.field === field

    if (isEditing) {
      if (options) {
        return (
          <select
            autoFocus
            defaultValue={value}
            onBlur={() => setEditingCell(null)}
            onChange={(e) => updateCell(rowId, field, e.target.value)}
            className="w-full px-2 py-1 border border-[#D76B1A] rounded text-sm bg-white focus:outline-none"
          >
            <option value="">—</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )
      }
      return (
        <input
          autoFocus
          defaultValue={value}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => updateCell(rowId, field, e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              ;(e.target as HTMLInputElement).blur()
            }
            if (e.key === "Escape") {
              ;(e.currentTarget as HTMLInputElement).value = value
              setEditingCell(null)
            }
          }}
          className="w-full px-2 py-1 border border-[#D76B1A] rounded text-sm bg-white focus:outline-none"
        />
      )
    }

    return (
      <button
        type="button"
        onClick={() => setEditingCell({ rowId, field })}
        className={`group w-full text-left px-2 py-1 -mx-2 rounded hover:bg-white border border-transparent hover:border-[#F7E2BD] transition cursor-text ${extraClass}`}
        title="Click to edit"
      >
        {value || <span className="text-[#5A4A42]/30 group-hover:text-[#5A4A42]/50">click to add</span>}
      </button>
    )
  }

  // Approve all ready rows that aren't duplicates. Duplicates stay unchecked — the user has to
  // opt in explicitly if they really want to import a row that matches an existing animal.
  const approveAllReady = () => {
    setParsedRows((prev) =>
      prev.map((row) => ({
        ...row,
        selected: row.status === "ready" && !row.isDuplicate ? true : row.selected,
      })),
    )
  }

  // Render step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {["upload", "detect", "mapping", "review", "complete"].map((step, index) => {
        const isActive = currentStep === step
        const isPast = ["upload", "detect", "mapping", "review", "complete"].indexOf(currentStep) > index

        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isActive
                  ? "bg-[#D76B1A] text-white"
                  : isPast
                    ? "bg-green-500 text-white"
                    : "bg-[#F7E2BD] text-[#5A4A42]"
              }`}
            >
              {isPast ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            {index < 4 && <div className={`w-12 h-1 mx-1 ${isPast ? "bg-green-500" : "bg-[#F7E2BD]"}`} />}
          </div>
        )
      })}
    </div>
  )

  const previewSampleRows = rawData.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#FBF8F4] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#5A4A42]">Import Data</h1>
          <p className="text-[#5A4A42]/70 mt-1">
            Import your existing animals and fosters from spreadsheets to get started quickly.
          </p>
        </div>

        <StepIndicator />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 flex-1">{error}</p>
            <button onClick={() => setError(null)} aria-label="Dismiss error">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Step 1: Upload */}
        {currentStep === "upload" && (
          <div className="bg-white rounded-2xl border border-[#F7E2BD] p-8">
            <div className="text-center mb-8">
              <FileSpreadsheet className="w-16 h-16 text-[#D76B1A] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#5A4A42]">Upload Your Spreadsheet</h2>
              <p className="text-[#5A4A42]/70 mt-2">
                Upload a CSV or Excel file you already use. We'll help map the columns - no cleanup needed.
              </p>
            </div>

            {/* Import type selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                { type: "animals" as ImportType, icon: Dog, label: "Animals", desc: "Import animal records" },
                { type: "fosters" as ImportType, icon: Users, label: "Fosters", desc: "Import approved fosters" },
              ].map(({ type, icon: Icon, label, desc }) => (
                <button
                  key={type}
                  onClick={() => setImportType(type)}
                  className={`p-4 rounded-xl border-2 transition text-left ${
                    importType === type
                      ? "border-[#D76B1A] bg-[#D76B1A]/5"
                      : "border-[#F7E2BD] hover:border-[#D76B1A]/50"
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-2 ${importType === type ? "text-[#D76B1A]" : "text-[#5A4A42]/50"}`} />
                  <p className="font-medium text-[#5A4A42]">{label}</p>
                  <p className="text-sm text-[#5A4A42]/60">{desc}</p>
                </button>
              ))}
            </div>

            {/* File drop zone */}
            {importType && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition cursor-pointer ${
                  parsing
                    ? "border-[#D76B1A] bg-[#D76B1A]/5"
                    : "border-[#F7E2BD] hover:border-[#D76B1A]"
                }`}
                onClick={() => !parsing && document.getElementById("file-input")?.click()}
              >
                {parsing ? (
                  <>
                    <div className="w-12 h-12 border-4 border-[#D76B1A]/30 border-t-[#D76B1A] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#5A4A42] font-medium">Reading {file?.name}...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-[#5A4A42]/40 mx-auto mb-4" />
                    <p className="text-[#5A4A42] font-medium">Drop your file here or click to browse</p>
                    <p className="text-sm text-[#5A4A42]/60 mt-1">Supports CSV and Excel files (.csv, .xlsx, .xls)</p>
                  </>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls,.xlsm"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Column Mapping */}
        {currentStep === "mapping" && (() => {
          const fields = importType === "fosters" ? fosterFields : animalFields
          const requiredFields = fields.filter((f) => f.tier === "required")
          const recommendedFields = fields.filter((f) => f.tier === "recommended")
          const optionalFields = fields.filter((f) => f.tier === "optional")
          const mappedTargets = new Set(columnMappings.map((m) => m.targetField).filter(Boolean) as string[])
          const unmappedRequired = requiredFields.filter((f) => !mappedTargets.has(f.value))
          const mappedRecommendedCount = recommendedFields.filter((f) => mappedTargets.has(f.value)).length

          return (
          <div className="bg-white rounded-2xl border border-[#F7E2BD] p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#5A4A42]">Match Your Sheet to Our Fields</h2>
                <p className="text-[#5A4A42]/70 mt-1">
                  For each field below, pick the matching column from your sheet. We've auto-matched what we
                  recognized — adjust anything that's wrong.
                </p>
              </div>
              <button
                onClick={() => setCurrentStep("upload")}
                className="flex items-center gap-2 text-[#5A4A42]/70 hover:text-[#5A4A42]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {/* Required mapping status */}
            {unmappedRequired.length > 0 ? (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  <strong>Missing required:</strong> map a column to{" "}
                  {unmappedRequired.map((f, i) => (
                    <span key={f.value}>
                      <strong>{f.label}</strong>
                      {i < unmappedRequired.length - 1 ? ", " : ""}
                    </span>
                  ))}{" "}
                  before continuing.
                </p>
              </div>
            ) : (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">
                  All required fields mapped. {mappedRecommendedCount} of {recommendedFields.length} recommended fields
                  mapped — {mappedRecommendedCount === recommendedFields.length
                    ? "looks great!"
                    : "map more for a fuller profile, or proceed as-is."}
                </p>
              </div>
            )}

            {/* Compact preview table — first 3 data rows */}
            {previewSampleRows.length > 0 && (
              <div className="mb-6 border border-[#F7E2BD] rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-[#FBF8F4] border-b border-[#F7E2BD]">
                  <p className="text-sm font-medium text-[#5A4A42]">
                    Preview — first {previewSampleRows.length} of {rawData.length} row{rawData.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white">
                      <tr>
                        {headers.map((header, i) => (
                          <th key={i} className="px-3 py-2 text-left font-medium text-[#5A4A42] whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F7E2BD]">
                      {previewSampleRows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {headers.map((_, colIdx) => (
                            <td
                              key={colIdx}
                              className="px-3 py-2 text-[#5A4A42]/80 whitespace-nowrap max-w-[200px] truncate"
                              title={row[colIdx] || ""}
                            >
                              {row[colIdx] || <span className="text-[#5A4A42]/30">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Field-first mapping: one row per field we save, dropdown picks the source column */}
            {(() => {
              // Build the column index lookup so we can show a sample value beside the chosen column
              const columnIndexByName = new Map<string, number>()
              headers.forEach((h, i) => columnIndexByName.set(h, i))

              const sourceColumnFor = (fieldValue: string): string | null =>
                columnMappings.find((m) => m.targetField === fieldValue)?.sourceColumn ?? null

              const sampleFor = (sourceColumn: string | null): string => {
                if (!sourceColumn) return ""
                const idx = columnIndexByName.get(sourceColumn)
                if (idx == null) return ""
                return rawData[0]?.[idx] || ""
              }

              const ignoredColumns = columnMappings.filter((m) => !m.targetField)

              const renderFieldRow = (field: FieldDef) => {
                const assigned = sourceColumnFor(field.value)
                const sample = sampleFor(assigned)
                const tierColor =
                  field.tier === "required"
                    ? "bg-[#D76B1A]"
                    : field.tier === "recommended"
                      ? "bg-green-600"
                      : "bg-[#5A4A42]/40"

                return (
                  <div key={field.value} className="flex items-center gap-4 p-3 bg-[#FBF8F4] rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tierColor}`} />
                        <p className="text-sm font-medium text-[#5A4A42] truncate">
                          {field.label}
                          {field.tier === "required" && <span className="text-[#D76B1A]"> *</span>}
                        </p>
                      </div>
                      {field.hint && <p className="text-xs text-[#5A4A42]/60 mt-0.5 ml-4">{field.hint}</p>}
                    </div>
                    <ArrowLeft className="w-4 h-4 text-[#5A4A42]/40 flex-shrink-0 rotate-180" />
                    <div className="flex-1 min-w-0">
                      <select
                        value={assigned || ""}
                        onChange={(e) => assignField(field.value, e.target.value || null)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${
                          field.tier === "required" && !assigned
                            ? "border-red-300 text-red-700"
                            : "border-[#F7E2BD] text-[#5A4A42]"
                        }`}
                      >
                        <option value="">
                          {field.tier === "required" ? "— pick a column (required) —" : "— not in my sheet —"}
                        </option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      {assigned && (
                        <p className="text-xs text-[#5A4A42]/60 mt-1 truncate" title={sample}>
                          Sample: {sample || <span className="italic">empty</span>}
                        </p>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <div className="space-y-6 mb-8">
                  {requiredFields.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#5A4A42] mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#D76B1A]" />
                        Required
                      </h3>
                      <div className="space-y-2">{requiredFields.map(renderFieldRow)}</div>
                    </div>
                  )}

                  {recommendedFields.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#5A4A42] mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-600" />
                        Recommended <span className="font-normal text-[#5A4A42]/60">— builds the profile</span>
                      </h3>
                      <div className="space-y-2">{recommendedFields.map(renderFieldRow)}</div>
                    </div>
                  )}

                  {optionalFields.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#5A4A42] mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#5A4A42]/40" />
                        Optional <span className="font-normal text-[#5A4A42]/60">— nice extras</span>
                      </h3>
                      <div className="space-y-2">{optionalFields.map(renderFieldRow)}</div>
                    </div>
                  )}

                  {/* Ignored columns — collapsible so users can verify nothing important is being dropped */}
                  {ignoredColumns.length > 0 && (
                    <div className="border border-[#F7E2BD] rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowIgnored((v) => !v)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#FBF8F4] transition"
                      >
                        <span className="text-sm font-medium text-[#5A4A42]">
                          {ignoredColumns.length} column{ignoredColumns.length === 1 ? "" : "s"} in your sheet will be
                          ignored
                        </span>
                        <span className="text-xs text-[#5A4A42]/60">
                          {showIgnored ? "Hide" : "Show"} {showIgnored ? "▲" : "▼"}
                        </span>
                      </button>
                      {showIgnored && (
                        <div className="px-4 py-3 border-t border-[#F7E2BD] bg-[#FBF8F4]">
                          <p className="text-xs text-[#5A4A42]/70 mb-3">
                            These columns aren't being saved. If something here should be — like a column we missed —
                            scroll up and pick it from the appropriate field's dropdown.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ignoredColumns.map((m) => {
                              const idx = columnIndexByName.get(m.sourceColumn)
                              const sample = idx != null ? rawData[0]?.[idx] || "" : ""
                              return (
                                <div
                                  key={m.sourceColumn}
                                  className="px-3 py-2 bg-white border border-[#F7E2BD] rounded-lg text-xs"
                                >
                                  <p className="font-medium text-[#5A4A42] truncate">{m.sourceColumn}</p>
                                  <p className="text-[#5A4A42]/60 truncate" title={sample}>
                                    {sample || <span className="italic">empty</span>}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3 text-xs text-[#5A4A42]/70 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D76B1A]" /> Required
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-600" /> Recommended
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#5A4A42]/40" /> Optional
                </span>
              </div>
              <button
                onClick={processDataForReview}
                disabled={unmappedRequired.length > 0}
                className="px-6 py-2 bg-[#D76B1A] text-white rounded-xl font-medium hover:bg-[#C55F14] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review Data
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          )
        })()}

        {/* Step 4: Review */}
        {currentStep === "review" && (
          <div className="bg-white rounded-2xl border border-[#F7E2BD] p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#5A4A42]">Review & Approve</h2>
                <p className="text-[#5A4A42]/70 mt-1">
                  Approve the rows you want to import. <strong>Click any cell to edit</strong> it — fix typos, fill in
                  blanks, or rename animals before importing.
                </p>
              </div>
              <button
                onClick={() => setCurrentStep("mapping")}
                className="flex items-center gap-2 text-[#5A4A42]/70 hover:text-[#5A4A42]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">
                  {parsedRows.filter((r) => r.status === "ready" && !r.isDuplicate).length}
                </p>
                <p className="text-sm text-green-700">Ready to import</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-xl">
                <p className="text-2xl font-bold text-yellow-600">
                  {parsedRows.filter((r) => r.status === "missing_info").length}
                </p>
                <p className="text-sm text-yellow-700">Missing info</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl">
                <p className="text-2xl font-bold text-orange-600">
                  {parsedRows.filter((r) => r.isDuplicate).length}
                </p>
                <p
                  className="text-sm text-orange-700"
                  title="Includes rows already in your org and duplicate rows within the same sheet"
                >
                  Duplicates
                </p>
              </div>
              <div className="p-4 bg-[#FBF8F4] rounded-xl">
                <p className="text-2xl font-bold text-[#D76B1A]">{parsedRows.filter((r) => r.selected).length}</p>
                <p className="text-sm text-[#5A4A42]/70">Approved</p>
              </div>
            </div>

            {/* Bulk actions */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                onClick={approveAllReady}
                className="px-3 py-1.5 bg-[#D76B1A]/10 text-[#D76B1A] rounded-lg text-sm font-medium hover:bg-[#D76B1A]/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve all ready ({parsedRows.filter((r) => r.status === "ready" && !r.isDuplicate).length})
              </button>
              <button
                onClick={() => setParsedRows((prev) => prev.map((r) => ({ ...r, selected: true })))}
                className="text-sm text-[#5A4A42]/70 hover:text-[#5A4A42]"
              >
                Approve all
              </button>
              <span className="text-[#5A4A42]/30">|</span>
              <button
                onClick={() => setParsedRows((prev) => prev.map((r) => ({ ...r, selected: false })))}
                className="text-sm text-[#5A4A42]/70 hover:text-[#5A4A42]"
              >
                Reject all
              </button>
            </div>

            {/* Data table */}
            <div className="border border-[#F7E2BD] rounded-xl overflow-hidden mb-6">
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#FBF8F4] sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70 w-10">✓</th>
                      {importType === "animals" && (
                        <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70 w-12">Photo</th>
                      )}
                      {importType === "animals" ? (
                        <>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Name</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Species</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Breed</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Age</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Gender</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Intake</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Stage</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">First Name</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Last Name</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Email</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Phone</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">City</th>
                        </>
                      )}
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F7E2BD]">
                    {parsedRows.map((row) => (
                      <tr key={row.id} className={row.selected ? "bg-[#D76B1A]/5" : ""}>
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRowSelection(row.id)}
                            className="w-4 h-4 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]"
                          />
                        </td>
                        {importType === "animals" && (
                          <td className="px-3 py-3">
                            {row.data.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.data.image_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover bg-[#F7E2BD]"
                                onError={(e) => {
                                  ;(e.currentTarget as HTMLImageElement).style.display = "none"
                                }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full bg-[#F7E2BD] flex items-center justify-center text-[#5A4A42]/40"
                                title="No photo"
                              >
                                <Dog className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                        )}
                        {importType === "animals" ? (
                          <>
                            <td className="px-3 py-2 font-medium text-[#5A4A42]">
                              {editableCell(row.id, "name", row.data.name || "")}
                            </td>
                            <td className="px-3 py-2 text-[#5A4A42]/80">
                              {editableCell(row.id, "species", row.data.species || "", [
                                "dog",
                                "cat",
                                "rabbit",
                                "bird",
                                "other",
                              ])}
                            </td>
                            <td className="px-3 py-2 text-[#5A4A42]/80">
                              {editableCell(row.id, "breed", row.data.breed || "")}
                            </td>
                            <td className="px-3 py-2 text-[#5A4A42]/80">
                              {editableCell(row.id, "age", row.data.age || "")}
                            </td>
                            <td className="px-3 py-2 text-[#5A4A42]/80">
                              {editableCell(row.id, "gender", row.data.gender || "", ["male", "female"])}
                            </td>
                            <td className="px-3 py-2 text-[#5A4A42]/80">
                              {editableCell(row.id, "intake_date", row.data.intake_date || "")}
                            </td>
                            <td className="px-3 py-2 text-[#5A4A42]/80">
                              {editableCell(row.id, "stage", row.data.stage || "", [
                                "intake",
                                "evaluation",
                                "available",
                                "in_foster",
                                "medical_hold",
                                "on_hold",
                                "adoption_pending",
                                "adopted",
                                "returned",
                              ])}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 font-medium text-[#5A4A42]">
                              {editableCell(row.id, "first_name", row.data.first_name || "")}
                            </td>
                            <td className="px-3 py-2 text-[#5A4A42]/80">
                              {editableCell(row.id, "last_name", row.data.last_name || "")}
                            </td>
                            <td className="px-3 py-2 text-[#5A4A42]/80">
                              {editableCell(row.id, "email", row.data.email || "")}
                            </td>
                            <td className="px-3 py-2 text-[#5A4A42]/80">
                              {editableCell(row.id, "phone", row.data.phone || "")}
                            </td>
                            <td className="px-3 py-2 text-[#5A4A42]/80">
                              {editableCell(row.id, "city", row.data.city || "")}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-3">
                          {row.isDuplicate ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-orange-100 text-orange-700"
                              title={
                                row.duplicateReason === "in_sheet"
                                  ? row.statusMessage || "Appears more than once in your sheet"
                                  : importType === "fosters"
                                    ? `An invitation for this email already exists in your org`
                                    : `An animal named "${row.data.name}" already exists in your org`
                              }
                            >
                              <AlertCircle className="w-3 h-3" />
                              {row.duplicateReason === "in_sheet" ? "Duplicate in sheet" : "Already exists"}
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                row.status === "ready"
                                  ? "bg-green-100 text-green-700"
                                  : row.status === "missing_info"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                              title={row.statusMessage || ""}
                            >
                              {row.status === "ready" && <CheckCircle2 className="w-3 h-3" />}
                              {row.status === "missing_info" && <AlertCircle className="w-3 h-3" />}
                              {row.status === "ready" ? "Ready" : row.statusMessage || "Needs review"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Helper message */}
            <div className="p-4 bg-blue-50 rounded-xl mb-6">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> Click any cell to edit. Two kinds of duplicates get flagged:{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
                  Already exists
                </span>{" "}
                means it's already in your org;{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
                  Duplicate in sheet
                </span>{" "}
                means the same {importType === "fosters" ? "email" : "name"} appears more than once in this upload.
                Both are unchecked by default — edit the cell to make it unique, or leave it skipped.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleImport}
                disabled={importing || parsedRows.filter((r) => r.selected).length === 0}
                className="px-6 py-2 bg-[#D76B1A] text-white rounded-xl font-medium hover:bg-[#C55F14] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Import {parsedRows.filter((r) => r.selected).length}{" "}
                    {importType === "animals" ? "Animal" : "Foster"}
                    {parsedRows.filter((r) => r.selected).length === 1 ? "" : "s"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {currentStep === "complete" && importResults && (() => {
          const successCount = importResults.animals + importResults.fosters
          const failCount = importResults.failures.length
          const allSucceeded = failCount === 0
          return (
          <div className="bg-white rounded-2xl border border-[#F7E2BD] p-8">
            <div className="text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  allSucceeded ? "bg-green-100" : "bg-yellow-100"
                }`}
              >
                {allSucceeded ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#5A4A42] mb-2">
                {allSucceeded
                  ? "You're Ready to Go!"
                  : successCount === 0
                    ? "Import didn't go through"
                    : "Imported with some errors"}
              </h2>
              {successCount > 0 && (
                <p className="text-[#5A4A42]/70 mb-2">
                  {importResults.animals > 0 &&
                    `${importResults.animals} animal${importResults.animals === 1 ? "" : "s"}`}
                  {importResults.animals > 0 && importResults.fosters > 0 && " and "}
                  {importResults.fosters > 0 &&
                    `${importResults.fosters} foster${importResults.fosters === 1 ? "" : "s"}`}{" "}
                  imported successfully.
                </p>
              )}
              {failCount > 0 && (
                <p className="text-sm text-yellow-700 mb-6">
                  {failCount} row{failCount === 1 ? "" : "s"} couldn't be imported. See details below.
                </p>
              )}
            </div>

            {/* Failure details — surface specific errors so user can fix the source data or report a bug */}
            {failCount > 0 && (
              <div className="mt-2 mb-8 border border-yellow-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800">
                    {failCount} failed row{failCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FBF8F4] sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[#5A4A42]/70">Row</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[#5A4A42]/70">Why it failed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F7E2BD]">
                      {importResults.failures.map((f, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-[#5A4A42] font-medium whitespace-nowrap">{f.name}</td>
                          <td className="px-4 py-2 text-[#5A4A42]/70 break-words">{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    If the same error keeps showing up across many rows, it's likely a column constraint we need to
                    handle (e.g. an unrecognized stage value). Send a screenshot of this list and we'll patch it.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {successCount > 0 && (
                <button
                  onClick={() => router.push(`/org/${orgId}/admin/${importType === "fosters" ? "fosters" : "dogs"}`)}
                  className="px-6 py-3 bg-[#D76B1A] text-white rounded-xl font-medium hover:bg-[#C55F14] transition flex items-center justify-center gap-2"
                >
                  {importType === "fosters" ? <Users className="w-4 h-4" /> : <Dog className="w-4 h-4" />}
                  View {importType === "fosters" ? "Fosters" : "Animals"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  setCurrentStep("upload")
                  setFile(null)
                  setHeaders([])
                  setRawData([])
                  setColumnMappings([])
                  setParsedRows([])
                  setImportResults(null)
                }}
                className="px-6 py-3 border border-[#F7E2BD] text-[#5A4A42] rounded-xl font-medium hover:bg-[#FBF8F4] transition flex items-center justify-center gap-2"
              >
                Import more data
              </button>
            </div>
          </div>
          )
        })()}
      </div>
    </div>
  )
}
