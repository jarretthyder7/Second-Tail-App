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

    // Send email notification to org admin
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("name, contact_email")
        .eq("id", orgId)
        .single()

      const { data: fosterProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single()

      if (org?.contact_email && fosterProfile?.name) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "supply-request",
            rescueEmail: org.contact_email,
            rescueName: org.name,
            fosterName: fosterProfile.name,
            supplies: itemName,
          }),
        })
      }
    } catch (emailError) {
      console.error("Email notification failed:", emailError)
    }

    return NextResponse.json({ success: true, id: newId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Request ID required" }, { status: 400 })
    }

    // Verify the request belongs to this foster and is still open
    const { data: existing, error: loadError } = await supabase
      .from("help_requests")
      .select("id, foster_id, status")
      .eq("id", id)
      .maybeSingle()

    if (loadError || !existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (existing.foster_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (existing.status !== "open") {
      return NextResponse.json({ error: "Only open requests can be cancelled" }, { status: 400 })
    }

    const { error } = await supabase.from("help_requests").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
