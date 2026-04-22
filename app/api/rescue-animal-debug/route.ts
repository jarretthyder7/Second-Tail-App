import { NextRequest } from 'next/server'

/** Debug probe round 2 — figure out the state filter + included relations. */
export const dynamic = 'force-dynamic'

type ProbeResult = {
  label: string
  url: string
  method: string
  requestBody?: any
  status?: number
  responseSnippet?: string
  error?: string
}

async function probe(
  label: string,
  url: string,
  method: 'GET' | 'POST',
  key: string,
  body?: any
): Promise<ProbeResult> {
  const result: ProbeResult = { label, url, method, requestBody: body }
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: key,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    })
    result.status = res.status
    const text = await res.text()
    result.responseSnippet = text.slice(0, 4000)
  } catch (err: any) {
    result.error = String(err?.message || err)
  }
  return result
}

export async function GET(req: NextRequest) {
  const state = (req.nextUrl.searchParams.get('state') || 'CO').trim()
  const key = process.env.RESCUEGROUPS_API_KEY
  if (!key) {
    return Response.json({ ok: false, error: 'missing key' }, { status: 500 })
  }

  const base = 'https://api.rescuegroups.org/v5/public/animals/search/available'
  const probes: ProbeResult[] = []

  // Filter-field candidates for state
  const stateFieldCandidates = [
    'locations.state',
    'orgs.state',
    'animals.locations.state',
    'animals.orgs.state',
    'state',
    'animals.stateName',
    'animals.state',
  ]
  for (const fieldName of stateFieldCandidates) {
    probes.push(
      await probe(
        `POST filter: ${fieldName}`,
        base,
        'POST',
        key,
        {
          data: {
            filters: [
              { fieldName, operation: 'equal', criteria: state },
            ],
          },
        }
      )
    )
  }

  // GET with include to see shape of related orgs + pictures
  probes.push(
    await probe(
      'GET /animals/search/available?include=orgs,pictures,statuses&limit=2',
      `${base}?include=orgs,pictures,statuses&limit=2`,
      'GET',
      key
    )
  )

  // Peek at /orgs/search to see what state filter field it uses there
  probes.push(
    await probe(
      'POST /orgs/search with state filter',
      'https://api.rescuegroups.org/v5/public/orgs/search',
      'POST',
      key,
      {
        data: {
          filters: [
            { fieldName: 'orgs.state', operation: 'equal', criteria: state },
          ],
        },
      }
    )
  )

  // Try the "search" endpoint variants to learn the public filter surface
  probes.push(
    await probe(
      'GET /orgs/search?state=CO&limit=1',
      `https://api.rescuegroups.org/v5/public/orgs/search?state=${encodeURIComponent(state)}&limit=1`,
      'GET',
      key
    )
  )

  return Response.json({ ok: true, state, probes }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
