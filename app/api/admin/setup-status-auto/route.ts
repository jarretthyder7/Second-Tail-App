import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { SETUP_STEPS } from "@/lib/setup-steps"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const orgId = searchParams.get("orgId")

  if (!orgId) {
    return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
  }

  try {
    const completedSteps: string[] = []

    // 1. org_profile - Check if org has name, address, phone
    const { data: org } = await supabase
      .from("organizations")
      .select("name, address, phone, email")
      .eq("id", orgId)
      .single()

    if (org && org.name && org.address && org.phone) {
      completedSteps.push("org_profile")
    }

    // 2. help_settings - Check if settings exist
    const { data: helpSettings } = await supabase
      .from("help_request_settings")
      .select("id")
      .eq("organization_id", orgId)
      .maybeSingle()

    if (helpSettings) {
      completedSteps.push("help_settings")
    }

    // 3. first_dog - Check if any dogs exist
    const { count: dogCount } = await supabase
      .from("dogs")
      .select("*", { count: "exact", head: 0 })
      .eq("organization_id", orgId)

    if (dogCount && dogCount > 0) {
      completedSteps.push("first_dog")
    }

    // 4. invite_foster - Check if any invitations exist
    const { count: invitationCount } = await supabase
      .from("invitations")
      .select("*", { count: "exact", head: 0 })
      .eq("organization_id", orgId)

    if (invitationCount && invitationCount > 0) {
      completedSteps.push("invite_foster")
    }

    // 5. create_team - Check if any teams exist
    const { count: teamCount } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: 0 })
      .eq("organization_id", orgId)

    if (teamCount && teamCount > 0) {
      completedSteps.push("create_team")
    }

    // 6. first_appointment - Check if any appointments exist
    const { count: appointmentCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: 0 })
      .eq("organization_id", orgId)

    if (appointmentCount && appointmentCount > 0) {
      completedSteps.push("first_appointment")
    }

    return NextResponse.json({
      completedSteps,
      total: SETUP_STEPS.length,
      completed: completedSteps.length,
      percentage: Math.round((completedSteps.length / SETUP_STEPS.length) * 100),
    })
  } catch (error) {
    console.error("[v0] Error auto-detecting setup status:", error)
    return NextResponse.json({ error: "Failed to detect setup status" }, { status: 500 })
  }
}
