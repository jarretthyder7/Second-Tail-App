import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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
    // Get completed setup steps
    const { data: completedSteps, error: stepsError } = await supabase
      .from("organization_setup_status")
      .select("setup_step_id")
      .eq("organization_id", orgId)
      .eq("is_completed", true)

    if (stepsError) throw stepsError

    const completedStepIds = completedSteps?.map((s) => s.setup_step_id) || []

    return NextResponse.json({
      completedSteps: completedStepIds,
      total: 8,
      completed: completedStepIds.length,
      percentage: Math.round((completedStepIds.length / 8) * 100),
    })
  } catch (error) {
    console.error("[v0] Error fetching setup status:", error)
    return NextResponse.json({ error: "Failed to fetch setup status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { orgId, stepId, isCompleted } = await request.json()

  if (!orgId || !stepId) {
    return NextResponse.json({ error: "Organization ID and step ID required" }, { status: 400 })
  }

  try {
    // Upsert setup status
    const { data, error } = await supabase
      .from("organization_setup_status")
      .upsert({
        organization_id: orgId,
        setup_step_id: stepId,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating setup status:", error)
    return NextResponse.json({ error: "Failed to update setup status" }, { status: 500 })
  }
}
