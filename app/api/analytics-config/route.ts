export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(
    {
      key: process.env.NEXT_PUBLIC_POSTHOG_KEY || null,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
    },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
  )
}
