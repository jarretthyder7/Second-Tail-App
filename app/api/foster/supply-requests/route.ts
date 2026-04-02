import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[v0] supply-request user:", user?.id, "error:", userError?.message)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", detail: userError?.message }, { status: 401 })
    }

    const body = await request.json()
    const { orgId, dogId, itemName, quantity, urgency, notes } = body
    console.log("[v0] supply-request body:", { orgId, dogId, itemName, quantity, urgency })

    // Get foster profile to ensure they belong to this org
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single()

    console.log("[v0] profile:", profile, "profileError:", profileError?.message)

    if (!profile || profile.organization_id !== orgId) {
      return NextResponse.json({ error: "Forbidden", profile_org: profile?.organization_id, requested_org: orgId }, { status: 403 })
    }

    // Create supply request
    const { data: request_data, error } = await supabase
      .from("help_requests")
      .insert({
        foster_id: user.id,
        organization_id: orgId,
        dog_id: dogId || null,
        title: `Supply Request: ${itemName}`,
        description: `Item: ${itemName}\nQuantity: ${quantity}\n\n${notes || ""}`.trim(),
        type: "supplies",
        category: "supplies",
        status: "open",
        priority: urgency === "urgent" ? "urgent" : urgency === "high" ? "high" : urgency === "low" ? "low" : "normal",
      })
      .select()
      .single()

    console.log("[v0] insert result:", request_data?.id, "error:", error?.message, error?.code)

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ request: request_data })
  } catch (error: any) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
