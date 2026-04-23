import { NextRequest } from 'next/server'

export const revalidate = 21600 // 6 hours

const STATE_ABBR: Record<string, string> = {
  Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',
  Colorado:'CO',Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',
  Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',
  Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',
  Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Mississippi:'MS',Missouri:'MO',
  Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH','New Jersey':'NJ',
  'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',
  Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI',
  'South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',
  Vermont:'VT',Virginia:'VA',Washington:'WA','West Virginia':'WV',Wisconsin:'WI',
  Wyoming:'WY','District of Columbia':'DC',
}
const US_ABBR_SET = new Set(Object.values(STATE_ABBR))

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function fullSizeImage(thumb?: string | null): string | null {
  if (!thumb) return null
  return String(thumb).replace(/[?&]width=\d+/, '').replace(/[?&]height=\d+/, '')
}

function cleanDescription(raw: string, maxLen = 400): string {
  if (!raw) return ''
  let s = decodeEntities(raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (s.length > maxLen) s = s.slice(0, maxLen - 1).trimEnd() + '…'
  return s
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function runQuery(key: string, body: any) {
  const url =
    'https://api.rescuegroups.org/v5/public/animals/search/available?include=orgs,pictures&limit=100'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: key,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body: JSON.stringify(body),
    next: { revalidate: 21600 },
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

export async function GET(req: NextRequest) {
  const rawState = (req.nextUrl.searchParams.get('state') || '').trim()
  const zip = (req.nextUrl.searchParams.get('zip') || '').trim()
  const radius = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get('radius') || '50', 10) || 50, 5),
    100
  )
  const speciesParam = (req.nextUrl.searchParams.get('species') || 'both').toLowerCase()
  const limit = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '12', 10) || 12, 1),
    24
  )
  const species = speciesParam === 'cat' || speciesParam === 'dog' ? speciesParam : 'both'

  const key = process.env.RESCUEGROUPS_API_KEY
  if (!key) {
    return Response.json({ ok: false, error: 'missing key', animals: [] }, { status: 500 })
  }

  const abbr = US_ABBR_SET.has(rawState.toUpperCase())
    ? rawState.toUpperCase()
    : STATE_ABBR[rawState] || ''

  // Build filters: prefer zip+radius (better NY metro coverage), fall back to state.
  let json: any = null
  let queryMode: 'zip' | 'state' | 'none' = 'none'

  if (/^\d{5}$/.test(zip)) {
    const body = {
      data: {
        filters: [],
        filterRadius: { miles: radius, postalcode: zip },
      },
    }
    json = await runQuery(key, body)
    queryMode = 'zip'
  }

  // If zip query returned nothing usable, try state fallback.
  if (
    (!json?.data || !Array.isArray(json.data) || json.data.length === 0) &&
    abbr
  ) {
    const body = {
      data: {
        filters: [
          { fieldName: 'orgs.state', operation: 'equal', criteria: abbr },
        ],
      },
    }
    json = await runQuery(key, body)
    queryMode = 'state'
  }

  if (!json?.data || !Array.isArray(json.data) || json.data.length === 0) {
    return Response.json({ ok: true, animals: [], queryMode })
  }

  const included: any[] = Array.isArray(json.included) ? json.included : []

  const allow = (slug: string): boolean => {
    if (species === 'dog') return slug.endsWith('-dog')
    if (species === 'cat') return slug.endsWith('-cat')
    return slug.endsWith('-dog') || slug.endsWith('-cat')
  }

  const picked: any[] = []
  const shuffled = shuffle(json.data as any[])
  for (const a of shuffled) {
    if (picked.length >= limit) break
    const attrs = a?.attributes || {}
    if (!attrs.pictureThumbnailUrl) continue
    if (attrs.isAdoptionPending) continue
    const slug = String(attrs.slug || '').toLowerCase()
    if (!allow(slug)) continue

    const orgId = a.relationships?.orgs?.data?.[0]?.id
    const org = included.find((r) => r.type === 'orgs' && r.id === orgId)
    const orgAttrs = org?.attributes || {}

    const picIds: string[] = (a.relationships?.pictures?.data || []).map((p: any) => p.id)
    let heroPhoto = fullSizeImage(attrs.pictureThumbnailUrl)
    if (picIds.length > 0) {
      const pic = included.find((r) => r.type === 'pictures' && picIds.includes(r.id))
      const u =
        pic?.attributes?.original?.url || pic?.attributes?.large?.url || pic?.attributes?.url
      if (u) heroPhoto = u
    }

    // Parse age years (for "Mika, 6" display).
    const ageString = String(attrs.ageString || '')
    let ageYears: number | null = null
    const yearMatch = ageString.match(/(\d+)\s*Years?/i)
    if (yearMatch) ageYears = parseInt(yearMatch[1], 10)

    // Traits — only include ones marked true/populated.
    const traits: Record<string, any> = {}
    if (attrs.isHousetrained === true) traits.housetrained = true
    if (attrs.isKidsOk === true) traits.kidsOk = true
    if (attrs.isDogsOk === true) traits.dogsOk = true
    if (attrs.isCatsOk === true) traits.catsOk = true
    if (attrs.isCurrentVaccinations === true) traits.vaccinated = true
    if (attrs.isSpecialNeeds === true) traits.specialNeeds = true
    if (attrs.activityLevel) traits.activityLevel = String(attrs.activityLevel)

    const listingUrl = orgAttrs.url
      ? String(orgAttrs.url)
      : `https://rescuegroups.org/animals/detail?AnimalID=${a.id}`

    picked.push({
      id: String(a.id),
      name: decodeEntities(String(attrs.name || 'Unnamed')).trim(),
      breed: attrs.breedString || attrs.breedPrimary || '',
      ageGroup: attrs.ageGroup || '',
      ageString,
      ageYears,
      sex: attrs.sex || '',
      size: attrs.sizeGroup || '',
      species: slug.endsWith('-cat') ? 'cat' : 'dog',
      needsFoster: !!attrs.isNeedingFoster,
      photo: heroPhoto,
      slug: attrs.slug || '',
      description: cleanDescription(attrs.descriptionText || attrs.descriptionHtml || ''),
      traits,
      listingUrl,
      rescue: {
        id: orgId,
        name: String(orgAttrs.name || '').trim(),
        city: String(orgAttrs.city || '').trim(),
        state: String(orgAttrs.state || abbr || '').trim(),
        email: String(orgAttrs.email || '').trim(),
        phone: String(orgAttrs.phone || '').trim() || null,
        url: String(orgAttrs.url || '').trim() || null,
      },
    })
  }

  return Response.json({ ok: true, animals: picked, queryMode, radius, zip })
}
