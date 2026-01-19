import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const dogId = formData.get("dogId") as string
    const documentType = (formData.get("documentType") as string) || "general"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!dogId) {
      return NextResponse.json({ error: "No dog ID provided" }, { status: 400 })
    }

    // Validate file type (allow common documents and images)
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: PDF, images, Word docs, text files",
        },
        { status: 400 },
      )
    }

    // Max 10MB for documents
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 10MB",
        },
        { status: 400 },
      )
    }

    const filename = `dogs/${dogId}/documents/${documentType}-${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: "public",
    })

    // Store document reference in database
    const supabase = await createServiceRoleClient()

    // Note: This assumes a documents table exists or we can store in metadata
    // For now, we'll create a timeline event for the document upload
    const { error: timelineError } = await supabase.from("timeline_events").insert({
      animal_id: dogId,
      type: "file_uploaded",
      title: `Document uploaded: ${file.name}`,
      description: `${documentType} document uploaded`,
      event_date: new Date().toISOString(),
      created_by: "Admin",
      visible_to_foster: false,
      metadata: {
        file_url: blob.url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        document_type: documentType,
      },
    })

    if (timelineError) {
      console.error("[API] Error creating timeline entry:", timelineError)
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      documentType,
    })
  } catch (error) {
    console.error("[API] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
