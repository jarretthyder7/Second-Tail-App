import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { canAccessDog } from "@/lib/api/auth-helpers"

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

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 10MB",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: dog, error: dogError } = await supabase.from("dogs").select("*").eq("id", dogId).maybeSingle()

    if (dogError) {
      console.error("[API] Error loading dog for document upload:", dogError.message)
      return NextResponse.json({ error: "Failed to verify access" }, { status: 500 })
    }

    if (!dog) {
      return NextResponse.json({ error: "Dog not found" }, { status: 404 })
    }

    if (!canAccessDog(profile, dog)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const filename = `dogs/${dogId}/documents/${documentType}-${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: "public",
    })

    // Timeline RLS in this project often allows only rescue inserts; after auth + access check we
    // still insert with service role so fosters can record uploads without opening anonymous access.
    const serviceSupabase = createServiceRoleClient()
    const { error: timelineError } = await serviceSupabase.from("timeline_events").insert({
      animal_id: dogId,
      type: "file_uploaded",
      title: `Document uploaded: ${file.name}`,
      description: `${documentType} document uploaded`,
      event_date: new Date().toISOString(),
      created_by: profile.name || user.email || "User",
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
