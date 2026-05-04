import { type NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"

// GET — list participants on this conversation (their profile info)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { conversationId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Confirm caller is an org member of this conversation's org (rescue staff or
    // the assigned foster — both should be able to see who's in the chat).
    const { data: conv } = await supabase
      .from("conversations")
      .select("id, organization_id, dog_id")
      .eq("id", conversationId)
      .single()
    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single()

    const isRescueInOrg =
      profile?.role === "rescue" && profile?.organization_id === conv.organization_id

    let isFosterOnConversation = false
    if (!isRescueInOrg && conv.dog_id) {
      const { data: dog } = await supabase
        .from("dogs")
        .select("foster_id")
        .eq("id", conv.dog_id)
        .single()
      isFosterOnConversation = dog?.foster_id === user.id
    }

    if (!isRescueInOrg && !isFosterOnConversation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const admin = createServiceRoleClient()
    const { data, error } = await admin
      .from("conversation_participants")
      .select(`
        id,
        added_at,
        user:profiles!conversation_participants_user_id_fkey(id, name, email, role, org_role)
      `)
      .eq("conversation_id", conversationId)
      .order("added_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ participants: data || [] })
  } catch (err) {
    console.error("GET participants error:", err)
    return NextResponse.json({ error: "Failed to load participants" }, { status: 500 })
  }
}

// POST — add a rescue staff user to the conversation. Caller must be a rescue
// staff member in the same org as the conversation.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { conversationId } = await params
    const body = await request.json().catch(() => null)
    const userIdToAdd: unknown = body?.userId

    if (typeof userIdToAdd !== "string" || !userIdToAdd) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: conv } = await supabase
      .from("conversations")
      .select("id, organization_id")
      .eq("id", conversationId)
      .single()
    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single()

    if (
      !callerProfile ||
      callerProfile.role !== "rescue" ||
      callerProfile.organization_id !== conv.organization_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify the user being added is a rescue staff member in the same org —
    // we don't allow adding fosters or members of other orgs.
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", userIdToAdd)
      .single()

    if (
      !targetProfile ||
      targetProfile.role !== "rescue" ||
      targetProfile.organization_id !== conv.organization_id
    ) {
      return NextResponse.json(
        { error: "Can only add rescue staff from your organization" },
        { status: 400 },
      )
    }

    const admin = createServiceRoleClient()
    const { data: inserted, error } = await admin
      .from("conversation_participants")
      .insert({
        conversation_id: conversationId,
        user_id: userIdToAdd,
        added_by: user.id,
      })
      .select(`
        id,
        added_at,
        user:profiles!conversation_participants_user_id_fkey(id, name, email, role, org_role)
      `)
      .single()

    if (error) {
      // Unique violation: already a participant — treat as success
      if ((error as any).code === "23505") {
        return NextResponse.json({ alreadyParticipant: true }, { status: 200 })
      }
      console.error("Add participant error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ participant: inserted })
  } catch (err) {
    console.error("POST participant error:", err)
    return NextResponse.json({ error: "Failed to add participant" }, { status: 500 })
  }
}
