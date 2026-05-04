"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentUploadSectionProps {
  dogId: string
  onUploadComplete?: () => void
}

export function DocumentUploadSection({ dogId, onUploadComplete }: DocumentUploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [documentType, setDocumentType] = useState("medical")
  // Default off — most uploads are admin-only paperwork (vet records, intake). Admin
  // checks the box for things the foster genuinely needs to see (prescriptions, care guides).
  const [visibleToFoster, setVisibleToFoster] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("dogId", dogId)
      formData.append("documentType", documentType)
      formData.append("visibleToFoster", visibleToFoster ? "true" : "false")

      const response = await fetch("/api/upload/document", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload document")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: `${file.name} has been uploaded successfully.`,
      })

      onUploadComplete?.()

      // Reset file input
      event.target.value = ""
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED4] p-6">
      <h3 className="text-lg font-semibold text-[#5A4A42] mb-4">Upload Documents</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#5A4A42] mb-2">Document Type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-[#E5DED4] rounded-lg bg-white"
            disabled={isUploading}
          >
            <option value="medical">Medical Records</option>
            <option value="vaccination">Vaccination Records</option>
            <option value="adoption">Adoption Papers</option>
            <option value="behavior">Behavior Assessment</option>
            <option value="intake">Intake Forms</option>
            <option value="general">General Document</option>
          </select>
        </div>

        <div>
          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E5DED4] cursor-pointer hover:bg-[#FDF8F3] transition">
            <input
              type="checkbox"
              checked={visibleToFoster}
              onChange={(e) => setVisibleToFoster(e.target.checked)}
              disabled={isUploading}
              className="w-4 h-4 mt-0.5 rounded border-[#E5DED4] text-[#D76B1A] focus:ring-[#D76B1A] cursor-pointer flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {visibleToFoster ? (
                  <Eye className="w-3.5 h-3.5 text-[#D76B1A]" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-[#5A4A42]/50" />
                )}
                <p className="text-sm font-medium text-[#5A4A42]">Share with foster</p>
              </div>
              <p className="text-xs text-[#5A4A42]/60 mt-0.5">
                {visibleToFoster
                  ? "Foster will see this document on their animal page."
                  : "Admin/staff only. Foster won't see this document."}
              </p>
            </div>
          </label>
        </div>

        <div>
          <label
            htmlFor="document-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#E5DED4] rounded-xl cursor-pointer hover:bg-[#FDF8F3] transition ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D76B1A] mb-2"></div>
                  <p className="text-sm text-[#8B6F47]">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[#8B6F47] mb-2" />
                  <p className="text-sm text-[#5A4A42] font-medium">Click to upload document</p>
                  <p className="text-xs text-[#8B6F47]">PDF, images, Word docs (max 10MB)</p>
                </>
              )}
            </div>
            <input
              id="document-upload"
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        <div className="bg-[#F7E2BD]/30 rounded-lg p-3">
          <p className="text-xs text-[#5A4A42]">
            <FileText className="inline w-3 h-3 mr-1" />
            Documents are automatically added to the timeline and can be referenced in care plans.
          </p>
        </div>
      </div>
    </div>
  )
}
