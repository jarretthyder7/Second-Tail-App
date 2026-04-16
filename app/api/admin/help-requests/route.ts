import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isRescueInOrg } from "@/lib/api/auth-helpers"

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { requestId, status, orgId, internalNote } = body

    if (!requestId || !orgId) {
      return NextResponse.json({ error: "Request ID and Organization ID required" }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || !isRescueInOrg(profile, orgId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: Record<string, any> = {}
    
    if (status) {
      updateData.status = status
      if (status === "resolved") {
        updateData.resolved_at = new Date().toISOString()
      }
    }

    // If adding internal note, append to description or a notes field
    if (internalNote) {
      // Get current request to append note
      const { data: currentRequest } = await supabase
        .from("help_requests")
        .select("description")
        .eq("id", requestId)
        .single()

      const existingDesc = currentRequest?.description || ""
      const noteTimestamp = new Date().toLocaleString()
      const formattedNote = `\n\n---\n[Internal Note - ${noteTimestamp}]\n${internalNote}`
      updateData.description = existingDesc + formattedNote
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("help_requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single()

    if (error) {
      console.error('Error updating help request:', error)
      return NextResponse.json({ error: "Failed to update help request" }, { status: 500 })
    }

    return NextResponse.json({ success: true, request: data })
  } catch (error) {
    console.error('Error updating help request:', error)
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json(
      { error: "Failed to update help request. Please try again." },
      { status: 500 }
    )
  }
}

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || !isRescueInOrg(profile, orgId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: requests, error } = await supabase
      .from("help_requests")
      .select(`
        *,
        foster:profiles!help_requests_foster_id_fkey(id, name, email),
        dog:dogs!help_requests_dog_id_fkey(id, name, organization_id)
      `)
      .eq("dog.organization_id", orgId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error('Error fetching help requests:', error)
      return NextResponse.json({ error: "Failed to fetch help requests" }, { status: 500 })
    }

    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    console.error('Error in help requests API:', error)
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    )
  }
}
