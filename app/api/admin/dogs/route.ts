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

    // Get dogs for this organization
    const { data: dogs, error } = await supabase
      .from("dogs")
      .select(`
        *,
        foster:profiles!dogs_foster_id_fkey(id, name, email)
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching dogs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] API Found dogs:", dogs?.length || 0)

    return NextResponse.json({ dogs: dogs || [] })
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
