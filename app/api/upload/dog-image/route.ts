import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { canAccessDog } from "@/lib/api/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const dogId = formData.get("dogId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!dogId) {
      return NextResponse.json({ error: "No dog ID provided" }, { status: 400 })
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

    // Check if this is a temporary ID for a new animal being created
    const isTempId = dogId.startsWith("temp-")

    if (isTempId) {
      // For new animals, just upload the image without database verification
      const filename = `dogs/new/${Date.now()}-${file.name}`
      const blob = await put(filename, file, {
        access: "public",
      })

      return NextResponse.json({
        url: blob.url,
        filename: file.name,
        size: file.size,
        type: file.type,
      })
    }

    // For existing animals, verify access and update the database
    const { data: dog, error: dogError } = await supabase.from("dogs").select("*").eq("id", dogId).maybeSingle()

    if (dogError) {
      console.error("[API] Error loading dog for upload:", dogError.message)
      return NextResponse.json({ error: "Failed to verify access" }, { status: 500 })
    }

    if (!dog) {
      return NextResponse.json({ error: "Dog not found" }, { status: 404 })
    }

    if (!canAccessDog(profile, dog)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const filename = `dogs/${dogId}/${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: "public",
    })

    const { data: updatedDog, error } = await supabase
      .from("dogs")
      .update({ image_url: blob.url })
      .eq("id", dogId)
      .select()
      .single()

    if (error) {
      console.error("[API] Error updating dog image:", error)
      return NextResponse.json({ error: "Failed to update dog image" }, { status: 400 })
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      dog: updatedDog,
    })
  } catch (error) {
    console.error("[API] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
