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

    const priority = urgency === "urgent" ? "urgent" : urgency === "high" ? "high" : urgency === "low" ? "low" : "normal"
    const description = `Item: ${itemName}\nQuantity: ${quantity}\n\n${notes || ""}`.trim()

    // Use rpc to bypass PostgREST schema cache
    const { data: newId, error } = await supabase.rpc("insert_supply_request", {
      p_foster_id: user.id,
      p_organization_id: orgId,
      p_dog_id: dogId || null,
      p_title: `Supply Request: ${itemName}`,
      p_description: description,
      p_category: "supplies",
      p_status: "open",
      p_priority: priority,
    })

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ request: { id: newId } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
