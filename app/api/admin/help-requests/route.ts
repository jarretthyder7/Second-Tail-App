import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get("orgId")

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: requests, error } = await supabase
      .from("help_requests")
      .select(`
        *,
        foster:profiles!help_requests_foster_id_fkey(id, name, email),
        dog:dogs!help_requests_dog_id_fkey(id, name, organization_id)
      `)
      .eq("dog.organization_id", orgId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching help requests:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] API Found help requests:", requests?.length || 0)

    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
