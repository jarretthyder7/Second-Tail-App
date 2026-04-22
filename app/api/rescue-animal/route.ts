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

// Tier 3 fallback — 12 state dogs, kept from the previous implementation
const STATE_DOGS: Record<string, { breed: string; year: number; fact: string }> = {
  Alaska: { breed: 'Alaskan Malamute', year: 2010, fact: 'Bred by the Mahlemut Inupiaq people to haul freight across arctic ice. Loyal, hardworking, and — when they end up in shelters — in huge need of patient foster homes.' },
  Georgia: { breed: 'Adoptable Dogs & Cats', year: 2016, fact: "Georgia is the first and only state to name shelter and rescue animals as its official state pet. If you foster in Georgia, you're literally living out state law." },
  Louisiana: { breed: 'Catahoula Leopard Dog', year: 1979, fact: 'The only dog breed developed in Louisiana — bred by Choctaw tribes and early settlers. Smart, loyal, and famous for climbing trees.' },
  Maryland: { breed: 'Chesapeake Bay Retriever', year: 1964, fact: "Descended from two Newfoundland puppies rescued from a shipwreck off the Maryland coast in 1807. Maryland\u2019s only native breed." },
  Massachusetts: { breed: 'Boston Terrier', year: 1979, fact: "Nicknamed 'America's Gentleman.' Bred in Boston in the 1870s — one of the first dog breeds developed in the United States." },
  'New Hampshire': { breed: 'Chinook', year: 2009, fact: 'Created by explorer Arthur Walden in Wonalancet, New Hampshire around 1917 for sledding. Once one of the rarest breeds on earth.' },
  'North Carolina': { breed: 'Plott Hound', year: 1989, fact: 'Named for Johannes Plott, who brought his hounds from Germany to North Carolina in 1750.' },
  Pennsylvania: { breed: 'Great Dane', year: 1965, fact: 'Gentle giants — adopted as Pennsylvania\u2019s state dog in 1965. Frequently surrendered because of their size.' },
  'South Carolina': { breed: 'Boykin Spaniel', year: 1985, fact: 'Developed by L.W. "Whit" Boykin in Camden, SC in the early 1900s. Known as "the dog that doesn\u2019t rock the boat."' },
  Texas: { breed: 'Blue Lacy', year: 2005, fact: 'Named for the Lacy brothers who bred them in Texas in the mid-1800s. The only breed developed in Texas.' },
  Virginia: { breed: 'American Foxhound', year: 1966, fact: 'Developed by colonial Virginians — including George Washington, who kept a pack at Mount Vernon.' },
  Wisconsin: { breed: 'American Water Spaniel', year: 1985, fact: 'Bred in Wisconsin in the 1800s to hunt from boats on the Fox River. One of very few US-developed breeds.' },
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

type AnimalResponse =
  | { ok: true; state: string; type: 'animal'; animal: any; rescue: any }
  | { ok: true; state: string; type: 'stateDog'; story: any }
  | { ok: true; state: string; type: 'generic'; story: any }

async function fetchAnimalsForState(stateAbbr: string, key: string) {
  const url = 'https://api.rescuegroups.org/v5/public/animals/search/available?include=orgs,pictures,species'
  const body = {
    data: {
      filters: [
        { fieldName: 'orgs.state', operation: 'equal', criteria: stateAbbr },
        { fieldName: 'animals.isAdoptionPending', operation: 'equal', criteria: false },
        { fieldName: 'animals.pictureCount', operation: 'greaterthan', criteria: 0 },
      ],
      sort: [{ fieldName: 'animals.updatedDate', sortDirection: 'desc' }],
      limit: 50,
    },
  }

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
  const json = await res.json().catch(() => null)
  if (!json?.data || !Array.isArray(json.data) || json.data.length === 0) return null
  return json
}

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state')?.trim() || ''
  if (!state) {
    return Response.json({ ok: false, error: 'missing state' }, { status: 400 })
  }
  const abbr = STATE_ABBR[state]
  const key = process.env.RESCUEGROUPS_API_KEY

  if (!abbr || !key) {
    return Response.json(buildGeneric(state))
  }

  try {
    const json = await fetchAnimalsForState(abbr, key)
    if (json) {
      // Pick a random animal that actually has a usable image.
      const candidates = (json.data as any[]).filter((a) => {
        const attrs = a?.attributes || {}
        const hasPic = !!attrs.pictureThumbnailUrl && attrs.pictureCount > 0
        return hasPic && !attrs.isAdoptionPending
      })
      const pick = candidates.length
        ? candidates[Math.floor(Math.random() * Math.min(candidates.length, 25))]
        : null

      if (pick) {
        const attrs = pick.attributes || {}
        const orgId = pick.relationships?.orgs?.data?.[0]?.id
        const included: any[] = Array.isArray(json.included) ? json.included : []
        const org = included.find((r) => r.type === 'orgs' && r.id === orgId)
        const orgAttrs = org?.attributes || {}

        // Find the first picture in included[] for a nicer full-size image
        const picIds: string[] = (pick.relationships?.pictures?.data || []).map((p: any) => p.id)
        let heroPhoto = fullSizeImage(attrs.pictureThumbnailUrl)
        if (picIds.length > 0) {
          const pic = included.find((r) => r.type === 'pictures' && picIds.includes(r.id))
          const url =
            pic?.attributes?.original?.url ||
            pic?.attributes?.large?.url ||
            pic?.attributes?.url
          if (url) heroPhoto = url
        }

        // Species
        const speciesId = pick.relationships?.species?.data?.[0]?.id
        const spRes = included.find((r) => r.type === 'species' && r.id === speciesId)
        const speciesName: string = spRes?.attributes?.singular || spRes?.attributes?.plural || ''

        // Listing URL — prefer rescue's own site if available, else rescuegroups.org search link.
        const listingUrl = orgAttrs.url
          ? String(orgAttrs.url)
          : `https://rescuegroups.org/animals/detail?AnimalID=${pick.id}`

        return Response.json({
          ok: true,
          state,
          type: 'animal',
          animal: {
            id: pick.id,
            name: attrs.name || 'A new friend',
            species: speciesName.toLowerCase(),
            breed: attrs.breedString || attrs.breedPrimary || '',
            age: attrs.ageString || attrs.ageGroup || '',
            sex: attrs.sex || '',
            size: attrs.sizeGroup || '',
            photo: heroPhoto,
            description: cleanDescription(attrs.descriptionText || attrs.descriptionHtml || ''),
            listingUrl,
          },
          rescue: {
            id: orgId,
            name: orgAttrs.name || 'A local rescue',
            city: orgAttrs.city || '',
            state: orgAttrs.state || abbr,
            url: orgAttrs.url || null,
            phone: orgAttrs.phone || null,
          },
        } as AnimalResponse)
      }
    }

    // No animal available — fall through to state dog, then generic.
    const dog = STATE_DOGS[state]
    if (dog) {
      return Response.json({
        ok: true,
        state,
        type: 'stateDog',
        story: {
          headline: dog.breed,
          snippet: dog.fact,
          breed: dog.breed,
          year: dog.year,
          source: '',
          date: null,
          url: '',
          image: null,
        },
      })
    }
    return Response.json(buildGeneric(state))
  } catch (e: any) {
    return Response.json(buildGeneric(state))
  }
}

function buildGeneric(state: string) {
  return {
    ok: true,
    state,
    type: 'generic',
    story: {
      headline: `Foster homes change everything in ${state}`,
      snippet: `A foster family in ${state} doesn't just save one life — they create space in the shelter for another. Second Tail makes signing up the easy part.`,
      source: '',
      date: null,
      url: '',
      image: null,
    },
  }
}
