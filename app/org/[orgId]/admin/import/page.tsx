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
  Info,
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
  { value: "age", label: "Age", tier: "recommended", synonyms: ["age", "age (years)", "age years"] },
  { value: "gender", label: "Gender", tier: "recommended", synonyms: ["gender", "sex"] },
  { value: "intake_date", label: "Intake Date", tier: "recommended", synonyms: ["intake date", "date of intake", "intake", "in date", "arrival date"] },
  { value: "stage", label: "Status/Stage", tier: "recommended", synonyms: ["status", "stage", "current status", "animal status"], hint: "Available, in foster, adopted, etc." },

  { value: "weight", label: "Weight", tier: "optional", synonyms: ["weight", "weight (lbs)", "weight lbs", "weight in lbs"] },
  { value: "medical_notes", label: "Medical Notes", tier: "optional", synonyms: ["medical notes", "medical", "vet notes", "health notes", "medical history"] },
  { value: "behavior_notes", label: "Behavior Notes", tier: "optional", synonyms: ["behavior notes", "behavior", "personality", "temperament", "behaviour notes"] },
  { value: "foster_name", label: "Current Foster (Name)", tier: "optional", synonyms: ["foster name", "current foster", "foster", "foster home", "foster parent"] },
  { value: "foster_email", label: "Current Foster (Email)", tier: "optional", synonyms: ["foster email", "foster e-mail", "current foster email"] },
]

// Foster field options for mapping
const fosterFields: FieldDef[] = [
  { value: "name", label: "Foster Name", tier: "required", synonyms: ["name", "foster name", "full name", "first name"] },
  { value: "email", label: "Email", tier: "required", synonyms: ["email", "e-mail", "email address"] },

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
  const [importResults, setImportResults] = useState<{ animals: number; fosters: number } | null>(null)
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

  // Process mappings and create preview rows
  const processDataForReview = () => {
    const fields = importType === "fosters" ? fosterFields : animalFields

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

      return {
        id: `row-${index}`,
        data,
        status,
        statusMessage,
        selected: status === "ready",
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

  // Handle import — insert all mapped fields that map to known dogs columns.
  const handleImport = async () => {
    setImporting(true)
    setError(null)

    const supabase = createClient()
    const selectedRows = parsedRows.filter((row) => row.selected && row.status !== "skipped")

    let animalsImported = 0
    let fostersImported = 0

    try {
      if (importType === "animals") {
        for (const row of selectedRows) {
          const insert: Record<string, unknown> = {
            organization_id: orgId,
            name: row.data.name?.trim() || "Unnamed Animal",
            species: row.data.species?.toLowerCase().trim() || "dog",
            stage: row.data.stage?.trim() || "intake",
            intake_date: toIsoDate(row.data.intake_date || "") || new Date().toISOString().split("T")[0],
          }

          // Pass through any additional mapped fields that map to real columns
          for (const col of DOG_COLUMNS) {
            if (col in insert) continue
            const val = row.data[col]
            if (val != null && val.trim() !== "") {
              insert[col] = val.trim()
            }
          }

          const { error } = await supabase.from("dogs").insert(insert)
          if (!error) {
            animalsImported++
          } else {
            console.error("Animal insert failed:", error, insert)
          }
        }
      }

      if (importType === "fosters") {
        for (const row of selectedRows) {
          const { error } = await supabase.from("invitations").insert({
            organization_id: orgId,
            email: row.data.email?.trim(),
            status: "pending",
          })

          if (!error) {
            fostersImported++
          } else {
            console.error("Foster invitation insert failed:", error)
          }
        }
      }

      setImportResults({ animals: animalsImported, fosters: fostersImported })
      setCurrentStep("complete")
    } catch (err) {
      console.error("Import failed:", err)
      setError("Import failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  // Toggle row selection
  const toggleRowSelection = (rowId: string) => {
    setParsedRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, selected: !row.selected } : row)))
  }

  // Approve all ready rows (selects every row with status === "ready")
  const approveAllReady = () => {
    setParsedRows((prev) =>
      prev.map((row) => ({
        ...row,
        selected: row.status === "ready" ? true : row.selected,
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
                <h2 className="text-xl font-semibold text-[#5A4A42]">Map Your Columns</h2>
                <p className="text-[#5A4A42]/70 mt-1">
                  We auto-matched what we recognized. Adjust anything that's wrong, or skip columns you don't need.
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

            {/* What we're looking for — onboarding guide */}
            <div className="mb-6 p-4 bg-[#FBF8F4] border border-[#F7E2BD] rounded-xl">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-[#D76B1A] flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-[#5A4A42]">
                  What we use to {importType === "fosters" ? "create foster records" : "build each animal's profile"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D76B1A]" />
                    <span className="font-semibold text-[#5A4A42]">Required</span>
                  </div>
                  <p className="text-[#5A4A42]/70 leading-relaxed">
                    {requiredFields.map((f) => f.label).join(", ")}.{" "}
                    {importType === "animals"
                      ? "Without this we can't create the animal."
                      : "Without these we can't invite the foster."}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-600" />
                    <span className="font-semibold text-[#5A4A42]">Recommended</span>
                  </div>
                  <p className="text-[#5A4A42]/70 leading-relaxed">
                    {recommendedFields.map((f) => f.label).join(", ")}. Map any you have — it builds a richer profile.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#5A4A42]/40" />
                    <span className="font-semibold text-[#5A4A42]">Optional</span>
                  </div>
                  <p className="text-[#5A4A42]/70 leading-relaxed">
                    {optionalFields.map((f) => f.label).join(", ")}. Nice extras — skip anything you don't track.
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#5A4A42]/60 mt-3 pt-3 border-t border-[#F7E2BD]">
                Anything else in your sheet (IDs, internal codes, columns we don't recognize) — leave on{" "}
                <strong>Skip this column</strong>. It won't affect the import.
              </p>
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

            {/* Column mappings */}
            <div className="space-y-3 mb-8">
              {columnMappings.map((mapping, index) => {
                const sample = rawData[0]?.[index] || ""
                const matched = fields.find((f) => f.value === mapping.targetField)
                return (
                  <div key={index} className="flex items-center gap-4 p-3 bg-[#FBF8F4] rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#5A4A42] truncate">{mapping.sourceColumn}</p>
                      <p className="text-xs text-[#5A4A42]/60 truncate">
                        Sample: {sample || <span className="italic">empty</span>}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#5A4A42]/40 flex-shrink-0" />
                    <div className="flex-1 flex items-center gap-2">
                      <select
                        value={mapping.targetField || ""}
                        onChange={(e) => {
                          const newMappings = [...columnMappings]
                          newMappings[index].targetField = e.target.value || null
                          setColumnMappings(newMappings)
                        }}
                        className="flex-1 px-3 py-2 border border-[#F7E2BD] rounded-lg text-sm text-[#5A4A42] bg-white"
                      >
                        <option value="">Skip this column</option>
                        {requiredFields.length > 0 && (
                          <optgroup label="── Required ──">
                            {requiredFields.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label} *
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {recommendedFields.length > 0 && (
                          <optgroup label="── Recommended (builds the profile) ──">
                            {recommendedFields.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {optionalFields.length > 0 && (
                          <optgroup label="── Optional (extras) ──">
                            {optionalFields.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      {matched && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs flex-shrink-0 ${
                            matched.tier === "required"
                              ? "text-[#D76B1A] font-medium"
                              : matched.tier === "recommended"
                                ? "text-green-700"
                                : "text-[#5A4A42]/60"
                          }`}
                          title={
                            matched.tier === "required"
                              ? "Required field"
                              : matched.tier === "recommended"
                                ? "Recommended — helps build a complete profile"
                                : "Optional extra"
                          }
                        >
                          <Check className="w-3 h-3" />
                          {matched.tier === "required"
                            ? "required"
                            : matched.tier === "recommended"
                              ? "recommended"
                              : "optional"}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

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
                  Approve the rows you want to import. Anything missing required info is unchecked by default — you can
                  still include it and clean up later.
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
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">
                  {parsedRows.filter((r) => r.status === "ready").length}
                </p>
                <p className="text-sm text-green-700">Ready to import</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-xl">
                <p className="text-2xl font-bold text-yellow-600">
                  {parsedRows.filter((r) => r.status === "missing_info").length}
                </p>
                <p className="text-sm text-yellow-700">Missing info</p>
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
                Approve all ready ({parsedRows.filter((r) => r.status === "ready").length})
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
                      <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Name</th>
                      {importType === "animals" ? (
                        <>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Species</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Breed</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Age</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Gender</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Intake</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Stage</th>
                        </>
                      ) : (
                        <>
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
                        <td className="px-3 py-3 font-medium text-[#5A4A42]">{row.data.name || "(no name)"}</td>
                        {importType === "animals" ? (
                          <>
                            <td className="px-3 py-3 text-[#5A4A42]/70">{row.data.species || "—"}</td>
                            <td className="px-3 py-3 text-[#5A4A42]/70">{row.data.breed || "—"}</td>
                            <td className="px-3 py-3 text-[#5A4A42]/70">{row.data.age || "—"}</td>
                            <td className="px-3 py-3 text-[#5A4A42]/70">{row.data.gender || "—"}</td>
                            <td className="px-3 py-3 text-[#5A4A42]/70">{row.data.intake_date || "—"}</td>
                            <td className="px-3 py-3 text-[#5A4A42]/70">{row.data.stage || "—"}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-3 text-[#5A4A42]/70">{row.data.email || "—"}</td>
                            <td className="px-3 py-3 text-[#5A4A42]/70">{row.data.phone || "—"}</td>
                            <td className="px-3 py-3 text-[#5A4A42]/70">{row.data.city || "—"}</td>
                          </>
                        )}
                        <td className="px-3 py-3">
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
                <strong>Tip:</strong> You can import rows with missing data and clean them up later. This won't affect
                foster access.
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
        {currentStep === "complete" && importResults && (
          <div className="bg-white rounded-2xl border border-[#F7E2BD] p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#5A4A42] mb-2">You're Ready to Go!</h2>
            <p className="text-[#5A4A42]/70 mb-8">
              {importResults.animals > 0 && `${importResults.animals} animal${importResults.animals === 1 ? "" : "s"}`}
              {importResults.animals > 0 && importResults.fosters > 0 && " and "}
              {importResults.fosters > 0 && `${importResults.fosters} foster${importResults.fosters === 1 ? "" : "s"}`}{" "}
              imported successfully.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push(`/org/${orgId}/admin/${importType === "fosters" ? "fosters" : "dogs"}`)}
                className="px-6 py-3 bg-[#D76B1A] text-white rounded-xl font-medium hover:bg-[#C55F14] transition flex items-center justify-center gap-2"
              >
                {importType === "fosters" ? <Users className="w-4 h-4" /> : <Dog className="w-4 h-4" />}
                View {importType === "fosters" ? "Fosters" : "Animals"}
                <ArrowRight className="w-4 h-4" />
              </button>
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
        )}
      </div>
    </div>
  )
}
