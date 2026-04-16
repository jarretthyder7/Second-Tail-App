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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, org_role, organization_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "rescue" || profile.organization_id !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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
      console.error('Error fetching dogs:', error)
      return NextResponse.json({ error: "Failed to fetch dogs" }, { status: 500 })
    }

    return NextResponse.json({ dogs: dogs || [] })
  } catch (error) {
    console.error('API Error:', error)
    const message = error instanceof Error ? error.message : "Something went wrong"
    
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    )
  }
}
