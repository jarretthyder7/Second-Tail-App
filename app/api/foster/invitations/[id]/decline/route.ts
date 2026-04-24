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

  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, email, status")
    .eq("id", invitationId)
    .single()

  if (
    !invitation ||
    invitation.status !== "pending" ||
    invitation.email.toLowerCase() !== user.email.toLowerCase()
  ) {
    return Response.json({ error: "Invitation not found" }, { status: 404 })
  }

  const { error } = await supabase
    .from("invitations")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("id", invitation.id)

  if (error) {
    return Response.json({ error: "Failed to decline invitation" }, { status: 500 })
  }

  return Response.json({ success: true })
}
