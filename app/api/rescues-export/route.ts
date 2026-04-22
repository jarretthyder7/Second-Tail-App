import { NextRequest } from 'next/server'

/**
 * One-shot outreach helper.
 * Pulls rescues in the requested state(s) from RescueGroups and returns CSV
 * (default) or JSON. Visit in your browser:
 *   /api/rescues-export?state=NY,NJ&format=csv
 *   /api/rescues-export?state=NY,NJ&format=json
 */
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
])

type OrgRow = {
  state: string
  name: string
  city: string
  email: string
  phone: string
  url: string
  facebook: string
  type: string
  services: string
  id: string
}

async function fetchOrgsByState(state: string, key: string): Promise<OrgRow[]> {
  const rows: OrgRow[] = []
  const pageSize = 100
  let pageNumber = 1
  let hasMore = true

  while (hasMore && pageNumber <= 20 /* safety cap = 2000 rows */) {
    const res = await fetch(
      `https://api.rescuegroups.org/v5/public/orgs/search?limit=${pageSize}&page=${pageNumber}`,
      {
        method: 'POST',
        headers: {
          Authorization: key,
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
        },
        body: JSON.stringify({
          data: {
            filters: [
              { fieldName: 'orgs.state', operation: 'equal', criteria: state },
            ],
          },
        }),
      }
    )
    if (!res.ok) break
    const json: any = await res.json().catch(() => null)
    const data = Array.isArray(json?.data) ? json.data : []
    for (const o of data) {
      const a = o?.attributes || {}
      rows.push({
        state,
        name: String(a.name || '').trim(),
        city: String(a.city || '').trim(),
        email: String(a.email || '').trim(),
        phone: String(a.phone || '').trim(),
        url: String(a.url || '').trim(),
        facebook: String(a.facebookUrl || '').trim(),
        type: String(a.type || '').trim(),
        services: String(a.services || '').trim(),
        id: String(o.id || ''),
      })
    }
    const pages = json?.meta?.pages || 1
    pageNumber += 1
    hasMore = pageNumber <= pages && data.length === pageSize
  }
  return rows
}

function csvEscape(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

function toCsv(rows: OrgRow[]): string {
  const header = [
    'state', 'name', 'city', 'email', 'phone', 'website', 'facebook', 'type', 'services', 'rescuegroups_id',
  ]
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push(
      [
        r.state, r.name, r.city, r.email, r.phone, r.url, r.facebook, r.type, r.services, r.id,
      ].map(csvEscape).join(',')
    )
  }
  return lines.join('\n')
}

export async function GET(req: NextRequest) {
  const key = process.env.RESCUEGROUPS_API_KEY
  if (!key) {
    return new Response('RESCUEGROUPS_API_KEY not configured', { status: 500 })
  }

  const stateParam = (req.nextUrl.searchParams.get('state') || '').toUpperCase()
  const format = (req.nextUrl.searchParams.get('format') || 'csv').toLowerCase()
  const onlyWithEmail = req.nextUrl.searchParams.get('with_email') !== '0'

  const requested = stateParam
    .split(',')
    .map((s) => s.trim())
    .filter((s) => US_STATES.has(s))

  if (requested.length === 0) {
    return new Response(
      'Usage: /api/rescues-export?state=NY,NJ[&format=csv|json][&with_email=0]\n\n' +
        'Provide comma-separated 2-letter state codes (e.g. NY,NJ,CT).',
      { status: 400 }
    )
  }

  const all: OrgRow[] = []
  for (const s of requested) {
    try {
      const rows = await fetchOrgsByState(s, key)
      all.push(...rows)
    } catch (e) {
      // Keep going; partial results are still useful.
    }
  }

  const filtered = onlyWithEmail ? all.filter((r) => r.email) : all

  if (format === 'json') {
    return Response.json(
      { ok: true, states: requested, count: filtered.length, rows: filtered },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const csv = toCsv(filtered)
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rescues-${requested.join('-').toLowerCase()}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
