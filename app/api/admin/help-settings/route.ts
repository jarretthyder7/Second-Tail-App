import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  try {
    // Get organization ID from query params
    const orgId = request.nextUrl.searchParams.get("orgId")
    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    let { data: settings, error } = await supabase
      .from("help_request_settings")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle()

    if (!settings) {
      // No settings yet, create defaults
      const { data: newSettings, error: createError } = await supabase
        .from("help_request_settings")
        .insert({
          organization_id: orgId,
        })
        .select()
        .single()

      if (createError) {
        console.error("[v0] Create settings error:", createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }
      settings = newSettings
    } else if (error) {
      console.error("[v0] Fetch settings error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(settings || {})
  } catch (error: any) {
    console.error("[v0] Help settings fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orgId, ...updates } = body

    // Verify admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .eq("organization_id", orgId)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Not an admin" }, { status: 403 })
    }

    // Update settings
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
  } catch (error: any) {
    console.error("[v0] Help settings update error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
