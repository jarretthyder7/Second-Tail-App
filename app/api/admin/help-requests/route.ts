import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isRescueInOrg } from "@/lib/api/auth-helpers"
import { sendSupplyAcknowledgedEmail } from "@/lib/email/send"

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
    const {
      requestId,
      status,
      orgId,
      internalNote,
      pickupTime,
      pickupLocation,
      pickupNotes,
    } = body

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

    // Acknowledge flow: pickupTime/pickupLocation arrive together with status="in_progress".
    // Stamp acknowledged_by + acknowledged_at server-side so the timestamp is trustworthy.
    const isAcknowledging = pickupTime || pickupLocation || pickupNotes != null
    if (isAcknowledging) {
      if (pickupTime) updateData.pickup_time = pickupTime
      if (pickupLocation) updateData.pickup_location = pickupLocation
      if (pickupNotes !== undefined) updateData.pickup_notes = pickupNotes
      updateData.acknowledged_by = user.id
      updateData.acknowledged_at = new Date().toISOString()
    }

    if (internalNote) {
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
      .select(`
        *,
        foster:profiles!help_requests_foster_id_fkey(id, name, email),
        organization:organizations!organization_id(id, name)
      `)
      .single()

    if (error) {
      console.error("Error updating help request:", error)
      return NextResponse.json({ error: "Failed to update help request" }, { status: 500 })
    }

    // Notify the foster on Acknowledge — best-effort, never fails the request
    if (isAcknowledging && data?.foster?.email) {
      try {
        const formattedPickup = data.pickup_time
          ? new Date(data.pickup_time).toLocaleString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "(time not set)"
        await sendSupplyAcknowledgedEmail(
          data.foster.email,
          data.foster.name?.split(" ")[0] || data.foster.name || "there",
          data.organization?.name || "Your rescue",
          data.title || "Supply request",
          formattedPickup,
          data.pickup_location || "(location pending)",
          data.pickup_notes || null,
          orgId,
        )
      } catch (emailErr) {
        console.warn("Acknowledged email failed to send:", emailErr)
      }
    }

    return NextResponse.json({ success: true, request: data })
  } catch (error) {
    console.error("Error updating help request:", error)
    return NextResponse.json(
      { error: "Failed to update help request. Please try again." },
      { status: 500 },
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
