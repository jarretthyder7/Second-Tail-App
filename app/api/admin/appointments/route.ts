import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isRescueInOrg } from "@/lib/api/auth-helpers"

function getRequestOrigin(request: Request): string {
  const url = new URL(request.url)
  const forwarded = request.headers.get("x-forwarded-host")
  const proto = request.headers.get("x-forwarded-proto") || "https"
  if (forwarded) {
    return `${proto}://${forwarded}`
  }
  return url.origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
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

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      dog:dogs(id, name, breed, image_url),
      foster:profiles!appointments_foster_id_fkey(id, name, email),
      team:teams(id, name, type),
      assigned_staff:profiles!appointments_assigned_to_fkey(id, name, email),
      created_by_user:profiles!appointments_created_by_fkey(id, name)
    `,
    )
    .eq("organization_id", orgId)
    .order("start_time", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching appointments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ appointments: appointments || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const orgId = body.organization_id as string | undefined

  if (!orgId) {
    return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || !isRescueInOrg(profile, orgId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      ...body,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating appointment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (appointment.foster_id) {
    try {
      const { data: foster } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", appointment.foster_id)
        .single()

      const { data: dog } = await supabase.from("dogs").select("id, name").eq("id", appointment.dog_id).single()

      if (foster && dog) {
        const appointmentTime = new Date(appointment.start_time).toLocaleString()
        const origin = getRequestOrigin(request)

        await fetch(new URL("/api/email/send", origin).href, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "appointment",
            fosterEmail: foster.email,
            fosterName: foster.name,
            dogName: dog.name,
            appointmentTitle: appointment.title,
            appointmentTime: appointmentTime,
          }),
        })
      }
    } catch (emailError) {
      console.warn("[v0] Failed to send appointment email:", emailError)
    }
  }

  return NextResponse.json({ appointment })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Appointment ID required" }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "rescue" || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: existing, error: loadError } = await supabase
    .from("appointments")
    .select("id, organization_id")
    .eq("id", id)
    .maybeSingle()

  if (loadError || !existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  }

  if (existing.organization_id !== profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await supabase.from("appointments").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting appointment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "Appointment ID required" }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "rescue" || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: existing, error: loadError } = await supabase
    .from("appointments")
    .select("id, organization_id")
    .eq("id", id)
    .maybeSingle()

  if (loadError || !existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  }

  if (existing.organization_id !== profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating appointment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ appointment })
}
