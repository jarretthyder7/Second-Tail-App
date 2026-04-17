import { NextResponse } from "next/server"

export async function GET() {
  // WARNING: Never expose secret status or key fragments in production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    // Only non-sensitive hints for local debugging (no keys, no prefixes, no service-role status).
    supabase: {
      projectUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
  }

  return NextResponse.json(diagnostics)
}
