import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isOrgMember, isRescueOrgAdmin } from "@/lib/api/auth-helpers"

/** When no DB row exists yet, fosters still need sane defaults for modals (matches table defaults). */
function defaultHelpSettingsResponse(orgId: string) {
  return {
    organization_id: orgId,
    contact_phone: null,
    emergency_phone: null,
    allowed_supply_types: ["Food", "Pee Pads", "Crate", "Toys", "Leash", "Medications", "Other"],
    allowed_appointment_types: ["Vet Visit", "Checkup", "Vaccination", "Dental", "Emergency"],
    appointment_booking_enabled: true,
    supplies_request_enabled: true,
    emergency_support_enabled: true,
  }
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get("orgId")
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
      .select("id, role, organization_id, org_role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || !isOrgMember(profile, orgId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let { data: settings, error } = await supabase
      .from("help_request_settings")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!settings) {
      if (isRescueOrgAdmin(profile, orgId)) {
        const { data: newSettings, error: createError } = await supabase
          .from("help_request_settings")
          .insert({
            organization_id: orgId,
          })
          .select()
          .single()

        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 500 })
        }
        settings = newSettings
      } else {
        return NextResponse.json(defaultHelpSettingsResponse(orgId))
      }
    }

    return NextResponse.json(settings || {})
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orgId, ...updates } = body

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, organization_id, org_role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || !isRescueOrgAdmin(profile, orgId)) {
      return NextResponse.json({ error: "Not an organization admin" }, { status: 403 })
    }

    const { data: settings, error } = await supabase
      .from("help_request_settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("organization_id", orgId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(settings)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
