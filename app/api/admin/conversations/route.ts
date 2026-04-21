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

    // Get conversations for this organization with their latest message
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        recipient:profiles!conversations_recipient_id_fkey(id, name, email, role),
        dog:dogs!conversations_dog_id_fkey(
          id,
          name,
          foster_id,
          foster:profiles!dogs_foster_id_fkey(id, name, email)
        ),
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
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    // Process conversations to add metadata for dashboard
    const processedConversations = (conversations || []).map(conv => {
      const messages = conv.messages || []
      const lastMessage = messages.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
      
      // Check if last message is from foster and unread by rescue
      const fosterId = conv.recipient?.id || conv.dog?.foster?.id || conv.dog?.foster_id || null
      const lastMessageSenderRole = lastMessage?.sender_id === fosterId ? "foster" : "rescue"
      const readByRescue = lastMessage?.read_at !== null

      return {
        ...conv,
        last_message: lastMessage,
        last_message_sender_role: lastMessageSenderRole,
        read_by_rescue: readByRescue,
        unread_count: fosterId ? messages.filter((m: any) => !m.read_at && m.sender_id === fosterId).length : 0
      }
    })

    return NextResponse.json({ conversations: processedConversations })
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
