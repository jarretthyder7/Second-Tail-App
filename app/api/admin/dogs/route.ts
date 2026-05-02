import { type NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"

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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const ids: unknown = body?.ids
    const orgId: unknown = body?.orgId

    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((i) => typeof i === "string")) {
      return NextResponse.json({ error: "ids must be a non-empty array of strings" }, { status: 400 })
    }
    if (typeof orgId !== "string" || !orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 })
    }

    // 1) Authenticate the caller and confirm they're a rescue admin for this org
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "rescue" || profile.organization_id !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2) Service-role delete (bypasses RLS), but scoped to ids that belong to this org so
    //    a compromised admin client can't delete other orgs' animals.
    const admin = createServiceRoleClient()
    const { data: deleted, error } = await admin
      .from("dogs")
      .delete()
      .in("id", ids as string[])
      .eq("organization_id", orgId)
      .select("id")

    if (error) {
      console.error("Bulk delete failed:", error)
      return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 })
    }

    return NextResponse.json({
      deleted: (deleted || []).length,
      requested: ids.length,
    })
  } catch (error) {
    console.error("Bulk delete API error:", error)
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
