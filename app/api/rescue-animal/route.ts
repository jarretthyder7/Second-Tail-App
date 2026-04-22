import { NextRequest } from 'next/server'

export const revalidate = 21600 // 6 hours

const STATE_ABBR: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO',
  Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY', 'District of Columbia': 'DC',
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-zA-Z]+;/g, ' ')
}

function cleanDescription(raw: string, maxLen = 240): string {
  if (!raw) return ''
  let s = decodeEntities(raw).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (s.length > maxLen) s = s.slice(0, maxLen - 1).trimEnd() + '…'
  return s
}

function fullSizeImage(thumb: string | undefined): string | null {
  if (!thumb) return null
  return thumb.replace(/[?&]width=\d+/, '').replace(/[?&]height=\d+/, '')
}

async function fetchAnimalsForState(
  stateAbbr: string,
  key: string
): Promise<{ json: any | null; debug: any }> {
  const debug: any = { stateAbbr }
  const url =
    'https://api.rescuegroups.org/v5/public/animals/search/available?include=orgs,pictures,species&limit=100'
  const body = {
    data: {
      filters: [
        { fieldName: 'orgs.state', operation: 'equal', criteria: stateAbbr },
      ],
    },
  }
  debug.requestUrl = url
  debug.requestBody = body

  try {
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
    debug.status = res.status
    const text = await res.text()
    debug.responseSnippet = text.slice(0, 400)
    if (!res.ok) return { json: null, debug }
    let json: any = null
    try {
      json = JSON.parse(text)
    } catch {
      debug.parseError = true
      return { json: null, debug }
    }
    if (!json?.data || !Array.isArray(json.data) || json.data.length === 0) {
      debug.emptyData = true
      return { json: null, debug }
    }
    debug.count = json.data.length
    debug.includedCount = Array.isArray(json.included) ? json.included.length : 0
    return { json, debug }
  } catch (e: any) {
    debug.fetchError = String(e?.message || e)
    return { json: null, debug }
  }
}

function emptyResponse(state: string, reason: string, debug: any, wantDebug: boolean) {
  const resp: any = {
    ok: true,
    state,
    type: 'empty',
    reason,
  }
  if (wantDebug) resp.debug = debug
  return Response.json(resp)
}

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state')?.trim() || ''
  const wantDebug = req.nextUrl.searchParams.get('debug') === '1'
  const speciesParam = (req.nextUrl.searchParams.get('species') || 'dog')
    .trim()
    .toLowerCase()
  const species =
    speciesParam === 'cat' || speciesParam === 'both' ? speciesParam : 'dog'

  if (!state) {
    return Response.json({ ok: false, error: 'missing state' }, { status: 400 })
  }
  const abbr = STATE_ABBR[state]
  const key = process.env.RESCUEGROUPS_API_KEY

  if (!abbr) {
    return emptyResponse(state, 'unrecognized_state', { state }, wantDebug)
  }
  if (!key) {
    return emptyResponse(state, 'no_api_key', {}, wantDebug)
  }

  const { json, debug } = await fetchAnimalsForState(abbr, key)
  if (!json) {
    return emptyResponse(state, 'no_animals_from_api', debug, wantDebug)
  }

  const included: any[] = Array.isArray(json.included) ? json.included : []

  // Filter to species (dog/cat/both) with usable photos, not adoption-pending.
  // Use slug which reliably ends in "-dog" / "-cat" / "-rabbit" / etc.
  const allowSlug = (slug: string): boolean => {
    if (species === 'dog') return slug.endsWith('-dog')
    if (species === 'cat') return slug.endsWith('-cat')
    return slug.endsWith('-dog') || slug.endsWith('-cat')
  }

  const matches = (json.data as any[]).filter((a) => {
    const attrs = a?.attributes || {}
    if (!attrs.pictureThumbnailUrl) return false
    if (attrs.isAdoptionPending) return false
    return allowSlug(String(attrs.slug || '').toLowerCase())
  })

  if (matches.length === 0) {
    debug.filteredToZero = true
    return emptyResponse(state, 'no_matches_with_photo', debug, wantDebug)
  }

  // Prefer foster-needed animals when there are enough of them — otherwise
  // fall back to the whole adoptable pool so variety wins. (Before we were
  // ALWAYS preferring foster-needed even if there were only 1-2, so the user
  // kept seeing the same dog on repeat throws.)
  const fosterMatches = matches.filter(
    (a) => a.attributes?.isNeedingFoster === true
  )
  const pool = fosterMatches.length >= 5 ? fosterMatches : matches
  // Pick from the full pool (up to our fetch limit, 100) instead of only 25.
  const pickIndex = Math.floor(Math.random() * pool.length)
  const pick = pool[pickIndex]

  const attrs = pick.attributes || {}
  const orgId = pick.relationships?.orgs?.data?.[0]?.id
  const org = included.find((r) => r.type === 'orgs' && r.id === orgId)
  const orgAttrs = org?.attributes || {}

  // Collect ALL full-size photos from included pictures.
  const picIds: string[] = (pick.relationships?.pictures?.data || []).map(
    (p: any) => p.id
  )
  const allPhotos: string[] = []
  for (const pid of picIds) {
    const pic = included.find((r) => r.type === 'pictures' && r.id === pid)
    const u =
      pic?.attributes?.original?.url ||
      pic?.attributes?.large?.url ||
      pic?.attributes?.url
    if (u && !allPhotos.includes(u)) allPhotos.push(u)
  }
  let heroPhoto = allPhotos[0] || fullSizeImage(attrs.pictureThumbnailUrl)

  // Parse age — extract years as a number for the "Name, age" header.
  const ageString = String(attrs.ageString || '')
  let ageYears: number | null = null
  const yearMatch = ageString.match(/(\d+)\s*Years?/i)
  if (yearMatch) ageYears = parseInt(yearMatch[1], 10)

  // Traits — only include ones set to true or with a usable value.
  const traits: Record<string, any> = {}
  if (attrs.isHousetrained === true) traits.housetrained = true
  if (attrs.isKidsOk === true) traits.kidsOk = true
  if (attrs.isDogsOk === true) traits.dogsOk = true
  if (attrs.isCatsOk === true) traits.catsOk = true
  if (attrs.isCurrentVaccinations === true) traits.vaccinated = true
  if (attrs.isSpecialNeeds === true) traits.specialNeeds = true
  if (attrs.activityLevel) traits.activityLevel = String(attrs.activityLevel)
  if (attrs.energyLevel) traits.energyLevel = String(attrs.energyLevel)
  if (attrs.adoptionFeeString) traits.adoptionFee = String(attrs.adoptionFeeString)

  // Prefer the rescue's own site. Otherwise send the user to a Google search
  // for the rescue + animal name — more useful than a generic RG detail page.
  const rescueName = orgAttrs.name ? String(orgAttrs.name) : ''
  const animalName = attrs.name ? String(attrs.name) : ''
  const searchFallback = `https://www.google.com/search?q=${encodeURIComponent(
    `${rescueName} ${animalName}`.trim() || 'animal rescue adoption'
  )}`
  const listingUrl = orgAttrs.url ? String(orgAttrs.url) : searchFallback

  const resp: any = {
    ok: true,
    state,
    type: 'animal',
    animal: {
      id: pick.id,
      name: attrs.name || 'A new friend',
      needsFoster: !!attrs.isNeedingFoster,
      breed: attrs.breedString || attrs.breedPrimary || '',
      ageString: ageString,
      ageGroup: attrs.ageGroup || '',
      ageYears,
      sex: attrs.sex || '',
      size: attrs.sizeGroup || '',
      photo: heroPhoto,
      photos: allPhotos,
      traits,
      description: cleanDescription(
        attrs.descriptionText || attrs.descriptionHtml || ''
      ),
      listingUrl,
      listingUrlIsFallback: !orgAttrs.url,
    },
    rescue: {
      id: orgId,
      name: orgAttrs.name || 'A local rescue',
      city: orgAttrs.city || '',
      state: orgAttrs.state || abbr,
      url: orgAttrs.url || null,
      phone: orgAttrs.phone || null,
    },
    poolInfo: {
      totalMatches: matches.length,
      fosterNeeded: fosterMatches.length,
      species,
    },
  }
  // Include species on the animal itself so the card can label correctly.
  const slug = String(attrs.slug || '').toLowerCase()
  resp.animal.species = slug.endsWith('-cat') ? 'cat' : 'dog'
  if (wantDebug) resp.debug = debug
  return Response.json(resp)
}
