import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

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

    const filename = `dogs/${dogId}/${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: "public",
    })

    const supabase = await createServiceRoleClient()
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
