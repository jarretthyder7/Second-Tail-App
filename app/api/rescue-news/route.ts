import { NextRequest } from 'next/server'

export const revalidate = 21600 // 6 hours

const BLOCKLIST = [
  'cruelty', 'abuse', 'abused', 'seized', 'charged', 'arrested',
  'guilty', 'dies', 'died', 'killed', 'kills', 'dead', 'fatal',
  'euthanize', 'euthanized', 'hoarder', 'hoarding', 'neglect',
  'stolen', 'theft', 'shooting', 'shot', 'obituary', 'obituaries',
  'obit', 'attack', 'attacked', 'mauled', 'bite', 'bitten',
  'dismember', 'carcass', 'crime', 'criminal', 'murdered', 'assault',
  'lawsuit', 'sued', 'raid', 'poisoned', 'torture',
]

const POSITIVE_HINTS = [
  'rescue', 'adopt', 'foster', 'saved', 'save', 'saves', 'sanctuary',
  'shelter', 'reunited', 'home', 'homes', 'new life', 'adoption',
  'adoptable', 'pup', 'pups', 'kitten', 'puppy', 'puppies',
]

type Story = {
  headline: string
  snippet: string
  source: string
  date: string | null
  url: string
  image: string | null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function parseGdeltDate(d: string | undefined): string | null {
  if (!d || d.length < 15) return null
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:${d.slice(13, 15)}Z`
}

async function fetchOgDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SecondTailBot/1.0; +https://getsecondtail.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    if (!res.ok) return ''
    const html = await res.text()
    const match =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i) ||
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
    if (!match) return ''
    let snippet = decodeEntities(match[1]).replace(/\s+/g, ' ').trim()
    if (snippet.length > 260) snippet = snippet.slice(0, 257).trimEnd() + '…'
    return snippet
  } catch {
    return ''
  }
}

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state')?.trim() || ''
  if (!state) {
    return Response.json({ ok: false, error: 'missing state' }, { status: 400 })
  }

  const query = encodeURIComponent(`"${state}" animal rescue`)
  const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=40&sort=DateDesc&sourcelang=english&sourcecountry=US`

  try {
    const res = await fetch(gdeltUrl, { next: { revalidate: 21600 } })
    if (!res.ok) {
      return Response.json({ ok: false, state, error: `gdelt ${res.status}` })
    }
    const data = await res.json().catch(() => ({ articles: [] }))
    const articles: any[] = Array.isArray(data?.articles) ? data.articles : []

    const filtered = articles.filter((a) => {
      const t = String(a?.title || '').toLowerCase()
      if (!t) return false
      if (BLOCKLIST.some((k) => t.includes(k))) return false
      if (!POSITIVE_HINTS.some((k) => t.includes(k))) return false
      return true
    })

    if (filtered.length === 0) {
      return Response.json({ ok: false, state, reason: 'no_clean_stories' })
    }

    // Try to enrich the top few with og:description; use the first that succeeds.
    const candidates = filtered.slice(0, 5)
    let chosen: Story | null = null
    for (const a of candidates) {
      const snippet = await fetchOgDescription(a.url)
      if (snippet) {
        chosen = {
          headline: decodeEntities(String(a.title || '')).trim(),
          snippet,
          source: String(a.domain || ''),
          date: parseGdeltDate(a.seendate),
          url: String(a.url || ''),
          image: a.socialimage || null,
        }
        break
      }
    }

    // Fallback: first filtered article, no snippet.
    if (!chosen) {
      const a = filtered[0]
      chosen = {
        headline: decodeEntities(String(a.title || '')).trim(),
        snippet: '',
        source: String(a.domain || ''),
        date: parseGdeltDate(a.seendate),
        url: String(a.url || ''),
        image: a.socialimage || null,
      }
    }

    return Response.json({ ok: true, state, story: chosen })
  } catch (e: any) {
    return Response.json({ ok: false, state, error: String(e?.message || e) }, { status: 500 })
  }
}
