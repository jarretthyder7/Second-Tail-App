import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Test 1: Simple count query
    const { data: countData, error: countError } = await supabase
      .from("dogs")
      .select("*", { count: "exact", head: true })

    // Test 2: Fetch specific dog
    const { data: dogData, error: dogError } = await supabase
      .from("dogs")
      .select("*")
      .eq("id", "6e7a7fcc-d134-4ea5-8e2b-63571d37fb00")
      .maybeSingle()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tests: {
        count: {
          success: !countError,
          error: countError?.message,
          count: countData,
        },
        specificDog: {
          success: !dogError,
          error: dogError?.message,
          found: !!dogData,
          dogName: dogData?.name,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
