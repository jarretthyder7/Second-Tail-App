import { NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get("orgId")

  if (!orgId) {
    return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, org_role, organization_id")
      .eq("id", user.id)
      .single()

    if (
      !adminProfile ||
      adminProfile.role !== "rescue" ||
      adminProfile.org_role !== "org_admin" ||
      adminProfile.organization_id !== orgId
    ) {
      return NextResponse.json({ error: "Forbidden: Not an admin of this organization" }, { status: 403 })
    }

    const serviceSupabase = await createServiceRoleClient()

    const { data: fosters, error: fostersError } = await serviceSupabase
      .from("profiles")
      .select("*")
      .eq("organization_id", orgId)
      .eq("role", "foster")
      .order("created_at", { ascending: false })

    if (fostersError) {
      console.error("[v0] API Error fetching fosters:", fostersError)
    }

    // Fetch dogs for each foster
    if (fosters && fosters.length > 0) {
      const fosterIds = fosters.map((f) => f.id)
      const { data: dogsData } = await serviceSupabase
        .from("dogs")
        .select("id, name, foster_id")
        .in("foster_id", fosterIds)

      // Attach dogs to fosters
      fosters.forEach((foster: any) => {
        foster.dogs = dogsData?.filter((d) => d.foster_id === foster.id) || []
      })
    }

    console.log("[v0] API Found fosters:", fosters?.length || 0)

    const { data: pendingInvitations, error: pendingError } = await serviceSupabase
      .from("invitations")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    const { data: acceptedInvitations, error: acceptedError } = await serviceSupabase
      .from("invitations")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "accepted")
      .order("updated_at", { ascending: false })
      .limit(20)

    const { data: cancelledInvitations, error: cancelledError } = await serviceSupabase
      .from("invitations")
      .select("*")
      .eq("organization_id", orgId)
      .in("status", ["declined", "cancelled"])
      .order("updated_at", { ascending: false })
      .limit(10)

    const { data: availableDogs, error: dogsError } = await serviceSupabase
      .from("dogs")
      .select("id, name, breed, image_url, status")
      .eq("organization_id", orgId)
      .in("status", ["available", "fostered"])
      .order("name", { ascending: true })

    if (pendingError || acceptedError || cancelledError || dogsError) {
      console.error("[v0] Error fetching data:", { pendingError, acceptedError, cancelledError, dogsError })
    }

    console.log("[v0] Accepted invitations:", acceptedInvitations?.length || 0)

    // Accept invitation if exists
    const invitation = pendingInvitations?.find((inv) => inv.status === "pending")
    if (invitation) {
      await supabase
        .from("invitations")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitation.id)

      try {
        await fetch(new URL("/api/email/send", process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3000").href, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "assigned-rescue",
            fosterEmail: invitation.foster_email,
            fosterName: invitation.foster_name,
            orgName: invitation.organization_name,
          }),
        })
      } catch (emailError) {
        console.warn("[v0] Failed to send rescue assignment email:", emailError)
      }

      console.log("[v0] Auto-accepted invitation from:", invitation.organization_name)
    }

    return NextResponse.json({
      fosters: fosters || [],
      pendingInvitations: pendingInvitations || [],
      acceptedInvitations: acceptedInvitations || [],
      cancelledInvitations: cancelledInvitations || [],
      availableDogs: availableDogs || [],
    })
  } catch (error) {
    console.error("[v0] Error in fosters API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
