import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isPlatformAdminEmail } from "@/lib/api/platform-admin"

// GET /api/admin/rescue-waitlist
// Lists waitlist entries for the platform admin queue. Filter via ?status=pending|accepted|all.
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isPlatformAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = (searchParams.get("status") || "pending").toLowerCase()

  const admin = createServiceRoleClient()
  let query = admin.from("rescue_waitlist").select("*").order("created_at", { ascending: false })
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }
  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ entries: data || [] })
}
