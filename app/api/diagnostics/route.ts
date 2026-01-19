import { NextResponse } from "next/server"

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
      serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || "MISSING",
    },
  }

  return NextResponse.json(diagnostics)
}
