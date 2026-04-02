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

    // Verify foster belongs to this org
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.organization_id !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: request_data, error } = await supabase
      .from("help_requests")
      .insert({
        foster_id: user.id,
        organization_id: orgId,
        dog_id: dogId || null,
        title: `Supply Request: ${itemName}`,
        description: `Item: ${itemName}\nQuantity: ${quantity}\n\n${notes || ""}`.trim(),
        category: "supplies",
        status: "open",
        priority: urgency === "urgent" ? "urgent" : urgency === "high" ? "high" : urgency === "low" ? "low" : "normal",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ request: request_data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
