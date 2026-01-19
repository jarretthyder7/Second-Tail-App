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

    // Get conversations for this organization with their latest message
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        recipient:profiles!conversations_recipient_id_fkey(id, name, email, role),
        dog:dogs!conversations_dog_id_fkey(id, name),
        messages(
          id,
          content,
          sender_id,
          read_at,
          created_at
        )
      `)
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching conversations:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process conversations to add metadata for dashboard
    const processedConversations = (conversations || []).map(conv => {
      const messages = conv.messages || []
      const lastMessage = messages.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
      
      // Check if last message is from foster and unread by rescue
      const lastMessageSenderRole = lastMessage?.sender_id === conv.recipient?.id ? "foster" : "rescue"
      const readByRescue = lastMessage?.read_at !== null

      return {
        ...conv,
        last_message: lastMessage,
        last_message_sender_role: lastMessageSenderRole,
        read_by_rescue: readByRescue,
        unread_count: messages.filter((m: any) => !m.read_at && m.sender_id === conv.recipient?.id).length
      }
    })

    return NextResponse.json({ conversations: processedConversations })
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
