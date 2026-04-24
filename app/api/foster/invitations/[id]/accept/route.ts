import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const idSchema = z.string().uuid()

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const idParsed = idSchema.safeParse(rawId)
  if (!idParsed.success) {
    return Response.json({ error: "Invalid invitation id" }, { status: 400 })
  }
  const invitationId = idParsed.data

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "foster") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  if (profile.organization_id) {
    return Response.json(
      { error: "You're already part of a rescue. Leave your current rescue to accept a new invitation." },
      { status: 409 },
    )
  }

  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, organization_id, email, status")
    .eq("id", invitationId)
    .single()

  if (
    !invitation ||
    invitation.status !== "pending" ||
    invitation.email.toLowerCase() !== user.email.toLowerCase()
  ) {
    return Response.json({ error: "Invitation not found" }, { status: 404 })
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ organization_id: invitation.organization_id })
    .eq("id", user.id)
  if (profileUpdateError) {
    return Response.json({ error: "Failed to accept invitation" }, { status: 500 })
  }

  await supabase
    .from("invitations")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", invitation.id)

  return Response.json({
    success: true,
    organization_id: invitation.organization_id,
    redirectTo: `/org/${invitation.organization_id}/foster/dashboard`,
  })
}
