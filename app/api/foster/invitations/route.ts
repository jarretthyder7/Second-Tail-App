import { createClient } from "@/lib/supabase/server"

// List pending invitations addressed to the currently-signed-in foster's email.
// Used by the dashboard banner that lets a foster explicitly accept or decline.
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("invitations")
    .select("id, organization_id, created_at, organizations(name, city, state)")
    .eq("email", user.email)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    return Response.json({ error: "Failed to load invitations" }, { status: 500 })
  }

  return Response.json({ invitations: data ?? [] })
}
