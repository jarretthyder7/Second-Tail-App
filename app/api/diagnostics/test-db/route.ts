import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET() {
  // WARNING: Never expose DB probes or service-role queries on the public internet.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const supabase = createServiceRoleClient()

    const { error: countError } = await supabase
      .from("dogs")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ok: !countError,
      error: countError?.message ?? null,
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
