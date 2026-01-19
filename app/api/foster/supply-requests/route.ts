import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orgId, dogId, itemName, quantity, urgency, notes } = body

    // Get foster profile to ensure they belong to this org
    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()

    if (!profile || profile.organization_id !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Create supply request
    const { data: request_data, error } = await supabase
      .from("help_requests")
      .insert({
        foster_id: user.id,
        dog_id: dogId,
        title: `Supply Request: ${itemName}`,
        description: `Item: ${itemName}\nQuantity: ${quantity}\nUrgency: ${urgency}\nNotes: ${notes || "None"}`,
        type: "supplies",
        category: "supplies",
        status: "open",
        priority: urgency === "urgent" ? "high" : urgency === "high" ? "normal" : "low",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating supply request:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Supply request created:", request_data?.id)

    return NextResponse.json({ request: request_data })
  } catch (error: any) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
