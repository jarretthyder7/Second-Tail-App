import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Use admin API to check if a user with this email exists
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      return NextResponse.json({ error: "Failed to check email" }, { status: 500 })
    }

    const exists = data.users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    return NextResponse.json({ exists })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
