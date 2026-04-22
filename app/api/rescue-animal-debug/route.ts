import { NextRequest } from 'next/server'

/**
 * Debug probe for the RescueGroups v5 API. Not a production route — we'll
 * delete this once the real /api/rescue-animal is built. For now, hits a
 * few candidate request shapes and dumps whatever comes back so we can
 * learn the actual response schema.
 *
 * Visit: /api/rescue-animal-debug?state=CO
 */
export const dynamic = 'force-dynamic'

type ProbeResult = {
  label: string
  url: string
  method: string
  requestHeaders?: Record<string, string>
  requestBody?: any
  status?: number
  statusText?: string
  responseHeaders?: Record<string, string>
  responseSnippet?: string
  error?: string
}

async function probe(
  label: string,
  url: string,
  method: 'GET' | 'POST',
  headers: Record<string, string>,
  body?: any
): Promise<ProbeResult> {
  const result: ProbeResult = {
    label,
    url,
    method,
    requestHeaders: { ...headers, Authorization: headers.Authorization ? '[redacted]' : '(none)' },
    requestBody: body,
  }
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    })
    result.status = res.status
    result.statusText = res.statusText
    const text = await res.text()
    result.responseSnippet = text.slice(0, 3000)
    const rh: Record<string, string> = {}
    res.headers.forEach((v, k) => (rh[k] = v))
    result.responseHeaders = rh
  } catch (err: any) {
    result.error = String(err?.message || err)
  }
  return result
}

export async function GET(req: NextRequest) {
  const state = (req.nextUrl.searchParams.get('state') || 'CO').trim()
  const key = process.env.RESCUEGROUPS_API_KEY
  if (!key) {
    return Response.json(
      { ok: false, error: 'RESCUEGROUPS_API_KEY env var not set' },
      { status: 500 }
    )
  }

  const base = 'https://api.rescuegroups.org/v5/public/animals/search/available'

  // Try a few shapes — exactly one should succeed.
  const probes: ProbeResult[] = []

  // Shape 1: POST with JSON:API filters body, Authorization: apikey <KEY>
  probes.push(
    await probe(
      'POST + apikey prefix + filters body',
      base,
      'POST',
      {
        'Content-Type': 'application/vnd.api+json',
        Authorization: `apikey ${key}`,
      },
      {
        data: {
          filters: [
            {
              fieldName: 'animals.locationState',
              operation: 'equal',
              criteria: state,
            },
          ],
        },
      }
    )
  )

  // Shape 2: POST with bare API key (no "apikey" prefix)
  probes.push(
    await probe(
      'POST + bare key + filters body',
      base,
      'POST',
      {
        'Content-Type': 'application/vnd.api+json',
        Authorization: key,
      },
      {
        data: {
          filters: [
            {
              fieldName: 'animals.locationState',
              operation: 'equal',
              criteria: state,
            },
          ],
        },
      }
    )
  )

  // Shape 3: GET with Authorization header
  probes.push(
    await probe(
      'GET + bare key + query params',
      `${base}?limit=3`,
      'GET',
      { Authorization: key }
    )
  )

  // Shape 4: POST with Bearer prefix
  probes.push(
    await probe(
      'POST + Bearer prefix + filters body',
      base,
      'POST',
      {
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${key}`,
      },
      {
        data: {
          filters: [
            {
              fieldName: 'animals.locationState',
              operation: 'equal',
              criteria: state,
            },
          ],
        },
      }
    )
  )

  return Response.json({ ok: true, state, probes }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
