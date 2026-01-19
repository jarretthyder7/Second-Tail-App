"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useParams } from "next/navigation"
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
}

// Animal field options for mapping
const animalFields = [
  { value: "name", label: "Animal Name", required: true },
  { value: "intake_date", label: "Intake Date", required: false },
  { value: "stage", label: "Status/Stage", required: false },
  { value: "foster_name", label: "Current Foster (Name)", required: false },
  { value: "foster_email", label: "Current Foster (Email)", required: false },
  { value: "breed", label: "Breed", required: false },
  { value: "age", label: "Age", required: false },
  { value: "gender", label: "Gender", required: false },
  { value: "weight", label: "Weight", required: false },
  { value: "species", label: "Species", required: false },
  { value: "medical_notes", label: "Medical Notes", required: false },
  { value: "behavior_notes", label: "Behavior Notes", required: false },
  { value: "internal_notes", label: "Internal Notes", required: false },
]

// Foster field options for mapping
const fosterFields = [
  { value: "name", label: "Foster Name", required: true },
  { value: "email", label: "Email", required: true },
  { value: "phone", label: "Phone", required: false },
  { value: "city", label: "City", required: false },
  { value: "state", label: "State", required: false },
  { value: "zip", label: "Zip Code", required: false },
  { value: "status", label: "Approved Status", required: false },
  { value: "notes", label: "Notes", required: false },
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
  const orgId = params.orgId as string

  const [currentStep, setCurrentStep] = useState<ImportStep>("upload")
  const [importType, setImportType] = useState<ImportType | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<string[][]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ animals: number; fosters: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Parse CSV content
  const parseCSV = (content: string): { headers: string[]; rows: string[][] } => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }

    const parseRow = (row: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < row.length; i++) {
        const char = row[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseRow(lines[0])
    const rows = lines.slice(1).map(parseRow)

    return { headers, rows }
  }

  // Handle file upload
  const handleFileUpload = useCallback(
    async (uploadedFile: File) => {
      setError(null)
      setFile(uploadedFile)

      try {
        const content = await uploadedFile.text()
        const { headers: parsedHeaders, rows } = parseCSV(content)

        if (parsedHeaders.length === 0) {
          setError("Could not parse file. Please ensure it's a valid CSV.")
          return
        }

        setHeaders(parsedHeaders)
        setRawData(rows)

        // Auto-detect initial column mappings based on header names
        const fields = importType === "fosters" ? fosterFields : animalFields
        const initialMappings: ColumnMapping[] = parsedHeaders.map((header) => {
          const headerLower = header.toLowerCase()
          const matchedField = fields.find(
            (f) =>
              headerLower.includes(f.value.toLowerCase()) ||
              headerLower.includes(f.label.toLowerCase().split(" ")[0].toLowerCase()),
          )
          return {
            sourceColumn: header,
            targetField: matchedField?.value || null,
          }
        })

        setColumnMappings(initialMappings)
        setCurrentStep("mapping")
      } catch (err) {
        setError("Failed to read file. Please try again.")
      }
    },
    [importType],
  )

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".xlsx"))) {
        handleFileUpload(droppedFile)
      } else {
        setError("Please upload a CSV or Excel file.")
      }
    },
    [handleFileUpload],
  )

  // Process mappings and create preview rows
  const processDataForReview = () => {
    const rows: ParsedRow[] = rawData.map((row, index) => {
      const data: Record<string, string> = {}
      let hasRequiredFields = true
      const missingFields: string[] = []

      columnMappings.forEach((mapping, colIndex) => {
        if (mapping.targetField && row[colIndex]) {
          data[mapping.targetField] = row[colIndex]
        }
      })

      // Check required fields
      const fields = importType === "fosters" ? fosterFields : animalFields
      fields
        .filter((f) => f.required)
        .forEach((field) => {
          if (!data[field.value] || data[field.value].trim() === "") {
            hasRequiredFields = false
            missingFields.push(field.label)
          }
        })

      let status: ParsedRow["status"] = "ready"
      let statusMessage = ""

      if (!hasRequiredFields) {
        status = "missing_info"
        statusMessage = `Missing: ${missingFields.join(", ")}`
      }

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

  // Handle import
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
          const { error } = await supabase.from("dogs").insert({
            organization_id: orgId,
            name: row.data.name || "Unnamed Animal",
            breed: row.data.breed || null,
            age: row.data.age ? Number.parseInt(row.data.age) : null,
            gender: row.data.gender || null,
            weight: row.data.weight ? Number.parseInt(row.data.weight) : null,
            species: row.data.species || "dog",
            stage: row.data.stage || "intake",
            intake_date: row.data.intake_date || new Date().toISOString().split("T")[0],
            medical_notes: row.data.medical_notes || null,
            behavior_notes: row.data.behavior_notes || null,
          })

          if (!error) {
            animalsImported++
          }
        }
      }

      if (importType === "fosters") {
        for (const row of selectedRows) {
          // Create invitation for foster
          const { error } = await supabase.from("invitations").insert({
            organization_id: orgId,
            email: row.data.email,
            status: "pending",
          })

          if (!error) {
            fostersImported++
          }
        }
      }

      setImportResults({ animals: animalsImported, fosters: fostersImported })
      setCurrentStep("complete")
    } catch (err) {
      setError("Import failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  // Toggle row selection
  const toggleRowSelection = (rowId: string) => {
    setParsedRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, selected: !row.selected } : row)))
  }

  // Select all ready rows
  const selectAllReady = () => {
    setParsedRows((prev) =>
      prev.map((row) => ({
        ...row,
        selected: row.status === "ready",
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
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
                className="border-2 border-dashed border-[#F7E2BD] rounded-xl p-12 text-center hover:border-[#D76B1A] transition cursor-pointer"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload className="w-12 h-12 text-[#5A4A42]/40 mx-auto mb-4" />
                <p className="text-[#5A4A42] font-medium">Drop your file here or click to browse</p>
                <p className="text-sm text-[#5A4A42]/60 mt-1">Supports CSV and Excel files</p>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Column Mapping */}
        {currentStep === "mapping" && (
          <div className="bg-white rounded-2xl border border-[#F7E2BD] p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#5A4A42]">Map Your Columns</h2>
                <p className="text-[#5A4A42]/70 mt-1">
                  Match your spreadsheet columns to the fields we need. Skip any you don't have.
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

            {/* Preview of first row */}
            {rawData.length > 0 && (
              <div className="mb-6 p-4 bg-[#FBF8F4] rounded-xl">
                <p className="text-sm font-medium text-[#5A4A42] mb-2">Preview (first row):</p>
                <div className="flex flex-wrap gap-2">
                  {headers.map((header, i) => (
                    <span key={i} className="px-2 py-1 bg-white rounded text-xs text-[#5A4A42]">
                      {header}: {rawData[0]?.[i] || "(empty)"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Column mappings */}
            <div className="space-y-3 mb-8">
              {columnMappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-[#FBF8F4] rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#5A4A42]">{mapping.sourceColumn}</p>
                    <p className="text-xs text-[#5A4A42]/60">Sample: {rawData[0]?.[index] || "(empty)"}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#5A4A42]/40" />
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
                    {(importType === "fosters" ? fosterFields : animalFields).map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label} {field.required && "*"}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <p className="text-sm text-[#5A4A42]/60">* Required fields</p>
              <button
                onClick={processDataForReview}
                className="px-6 py-2 bg-[#D76B1A] text-white rounded-xl font-medium hover:bg-[#C55F14] transition flex items-center gap-2"
              >
                Review Data
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === "review" && (
          <div className="bg-white rounded-2xl border border-[#F7E2BD] p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[#5A4A42]">Review & Approve</h2>
                <p className="text-[#5A4A42]/70 mt-1">
                  Review your data before importing. You can skip or edit any rows.
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
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-600">{parsedRows.filter((r) => r.selected).length}</p>
                <p className="text-sm text-gray-700">Selected</p>
              </div>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-4 mb-4">
              <button onClick={selectAllReady} className="text-sm text-[#D76B1A] hover:underline">
                Select all ready rows
              </button>
              <span className="text-[#5A4A42]/30">|</span>
              <button
                onClick={() => setParsedRows((prev) => prev.map((r) => ({ ...r, selected: true })))}
                className="text-sm text-[#5A4A42]/70 hover:text-[#5A4A42]"
              >
                Select all
              </button>
              <button
                onClick={() => setParsedRows((prev) => prev.map((r) => ({ ...r, selected: false })))}
                className="text-sm text-[#5A4A42]/70 hover:text-[#5A4A42]"
              >
                Deselect all
              </button>
            </div>

            {/* Data table */}
            <div className="border border-[#F7E2BD] rounded-xl overflow-hidden mb-6">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-[#FBF8F4] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Select</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Key Info</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5A4A42]/70">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F7E2BD]">
                    {parsedRows.map((row) => (
                      <tr key={row.id} className={row.selected ? "bg-[#D76B1A]/5" : ""}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRowSelection(row.id)}
                            className="w-4 h-4 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-[#5A4A42]">{row.data.name || "(No name)"}</td>
                        <td className="px-4 py-3 text-sm text-[#5A4A42]/70">
                          {importType === "fosters"
                            ? row.data.email || "(No email)"
                            : `${row.data.breed || "Unknown"} • ${row.data.age || "?"} yrs`}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              row.status === "ready"
                                ? "bg-green-100 text-green-700"
                                : row.status === "missing_info"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
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
                <strong>Tip:</strong> You can import rows with missing data - you can always clean them up later. This
                won't affect foster access.
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
                    Import {parsedRows.filter((r) => r.selected).length} Records
                    <ArrowRight className="w-4 h-4" />
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
              {importResults.animals > 0 && `${importResults.animals} animals`}
              {importResults.animals > 0 && importResults.fosters > 0 && " and "}
              {importResults.fosters > 0 && `${importResults.fosters} fosters`} imported successfully.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`/org/${orgId}/admin/dogs`}
                className="px-6 py-3 bg-[#D76B1A] text-white rounded-xl font-medium hover:bg-[#C55F14] transition flex items-center justify-center gap-2"
              >
                <Dog className="w-4 h-4" />
                View Animals
              </a>
              <a
                href={`/org/${orgId}/admin/fosters`}
                className="px-6 py-3 border border-[#F7E2BD] text-[#5A4A42] rounded-xl font-medium hover:bg-[#FBF8F4] transition flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                View Fosters
              </a>
            </div>

            <button
              onClick={() => {
                setCurrentStep("upload")
                setFile(null)
                setImportType(null)
                setHeaders([])
                setRawData([])
                setColumnMappings([])
                setParsedRows([])
                setImportResults(null)
              }}
              className="mt-6 text-sm text-[#5A4A42]/70 hover:text-[#5A4A42]"
            >
              Import more data
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
