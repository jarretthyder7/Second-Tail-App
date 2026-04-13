import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// uses rpc to bypass PostgREST schema cache
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, name")
      .eq("id", user.id)
      .single()

    if (!profile || profile.organization_id !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const priority = urgency === "urgent" ? "urgent" : urgency === "high" ? "high" : urgency === "low" ? "low" : "medium"
    const description = `Item: ${itemName}\nQuantity: ${quantity || 1}${notes ? "\n\n" + notes : ""}`.trim()

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

    // Send email notification to rescue org
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("name, email")
        .eq("id", orgId)
        .single()

      if (org) {
        const origin = new URL(request.url).origin
        await fetch(new URL("/api/email/send", origin).href, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "supply-request",
            rescueEmail: org.email,
            rescueName: org.name,
            fosterName: profile.name,
            supplies: itemName,
          }),
        })
      }
    } catch (emailError) {
      console.warn("[v0] Failed to send supply request email:", emailError)
    }

    return NextResponse.json({ success: true, id: newId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
