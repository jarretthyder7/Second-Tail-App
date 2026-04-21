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

// Tier 3: official state dogs / state pet, with facts that tie to rescue
const STATE_DOGS: Record<
  string,
  { breed: string; year: number; fact: string }
> = {
  Alaska: {
    breed: 'Alaskan Malamute',
    year: 2010,
    fact: 'Bred by the Mahlemut Inupiaq people to haul freight across arctic ice. Loyal, hardworking, and — when they end up in shelters — in huge need of patient foster homes.',
  },
  Georgia: {
    breed: 'Adoptable Dogs & Cats',
    year: 2016,
    fact: "Georgia is the first and only state to name shelter and rescue animals as its official state pet. If you foster in Georgia, you're literally living out state law.",
  },
  Louisiana: {
    breed: 'Catahoula Leopard Dog',
    year: 1979,
    fact: 'The only dog breed developed in Louisiana — bred by Choctaw tribes and early settlers. Smart, loyal, and famous for climbing trees. Catahoulas regularly end up in Southern shelters.',
  },
  Maryland: {
    breed: 'Chesapeake Bay Retriever',
    year: 1964,
    fact: 'Descended from two Newfoundland puppies rescued from a shipwreck off the Maryland coast in 1807. Maryland\u2019s only native breed.',
  },
  Massachusetts: {
    breed: 'Boston Terrier',
    year: 1979,
    fact: "Nicknamed 'America's Gentleman.' Bred in Boston in the 1870s — one of the first dog breeds developed in the United States.",
  },
  'New Hampshire': {
    breed: 'Chinook',
    year: 2009,
    fact: 'Created by explorer Arthur Walden in Wonalancet, New Hampshire around 1917 for sledding. Once one of the rarest breeds on earth.',
  },
  'North Carolina': {
    breed: 'Plott Hound',
    year: 1989,
    fact: 'Named for Johannes Plott, who brought his hounds from Germany to North Carolina in 1750. The only hound breed that originated in NC.',
  },
  Pennsylvania: {
    breed: 'Great Dane',
    year: 1965,
    fact: 'Adopted as Pennsylvania\u2019s state dog in 1965. Gentle giants — and frequent shelter surrenders because of their size.',
  },
  'South Carolina': {
    breed: 'Boykin Spaniel',
    year: 1985,
    fact: 'Developed by L.W. "Whit" Boykin in Camden, SC in the early 1900s. Known as "the dog that doesn\u2019t rock the boat" — small enough for a canoe.',
  },
  Texas: {
    breed: 'Blue Lacy',
    year: 2005,
    fact: 'Named for the Lacy brothers who bred them in Texas in the mid-1800s for ranch work. The only dog breed developed in Texas.',
  },
  Virginia: {
    breed: 'American Foxhound',
    year: 1966,
    fact: 'Developed by colonial Virginians — including George Washington, who kept a famous pack at Mount Vernon.',
  },
  Wisconsin: {
    breed: 'American Water Spaniel',
    year: 1985,
    fact: 'Bred in Wisconsin in the 1800s to hunt from boats along the Fox River. One of very few dog breeds developed entirely in the US.',
  },
}

type Story = {
  headline: string
  snippet: string
  source: string
  date: string | null
  url: string
  image: string | null
}

type Result =
  | { ok: true; state: string; type: 'news'; story: Story }
  | { ok: true; state: string; type: 'stateDog'; story: Omit<Story, 'date' | 'url' | 'source' | 'image'> & { date: null; url: ''; source: ''; image: null; breed: string; year: number } }
  | { ok: true; state: string; type: 'generic'; story: Omit<Story, 'date' | 'url' | 'source' | 'image'> & { date: null; url: ''; source: ''; image: null } }

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

async function tryNewsQuery(query: string): Promise<Story | null> {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  const tenYearsAgo = new Date(now)
  tenYearsAgo.setUTCFullYear(tenYearsAgo.getUTCFullYear() - 10)
  const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=50&sort=DateDesc&sourcelang=english&sourcecountry=US&startdatetime=${fmt(tenYearsAgo)}&enddatetime=${fmt(now)}`

  const res = await fetch(gdeltUrl, { next: { revalidate: 21600 } })
  if (!res.ok) return null
  const data = await res.json().catch(() => ({ articles: [] }))
  const articles: any[] = Array.isArray(data?.articles) ? data.articles : []

  const filtered = articles.filter((a) => {
    const t = String(a?.title || '').toLowerCase()
    if (!t) return false
    if (BLOCKLIST.some((k) => t.includes(k))) return false
    if (!POSITIVE_HINTS.some((k) => t.includes(k))) return false
    return true
  })

  if (filtered.length === 0) return null

  for (const a of filtered.slice(0, 5)) {
    const snippet = await fetchOgDescription(a.url)
    if (snippet) {
      return {
        headline: decodeEntities(String(a.title || '')).trim(),
        snippet,
        source: String(a.domain || ''),
        date: parseGdeltDate(a.seendate),
        url: String(a.url || ''),
        image: a.socialimage || null,
      }
    }
  }

  const a = filtered[0]
  return {
    headline: decodeEntities(String(a.title || '')).trim(),
    snippet: '',
    source: String(a.domain || ''),
    date: parseGdeltDate(a.seendate),
    url: String(a.url || ''),
    image: a.socialimage || null,
  }
}

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state')?.trim() || ''
  if (!state) {
    return Response.json({ ok: false, error: 'missing state' }, { status: 400 })
  }

  try {
    // Tier 1: specific rescue news in the state
    let story = await tryNewsQuery(`"${state}" animal rescue`)

    // Tier 2: broader animal good-news in the state
    if (!story) {
      story = await tryNewsQuery(`"${state}" (shelter OR adoption OR adopted OR reunited OR foster OR "new home")`)
    }

    if (story) {
      return Response.json({ ok: true, state, type: 'news', story } satisfies Result)
    }

    // Tier 3: state dog fact
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

    // Tier 4: generic foster-matters card
    return Response.json({
      ok: true,
      state,
      type: 'generic',
      story: {
        headline: `Foster homes change everything in ${state}`,
        snippet: `Every year, about 3 million dogs enter US shelters. A foster family in ${state} doesn't just save one life — they create space for another. Second Tail makes signing up the easy part.`,
        source: '',
        date: null,
        url: '',
        image: null,
      },
    })
  } catch (e: any) {
    return Response.json({ ok: false, state, error: String(e?.message || e) }, { status: 500 })
  }
}
