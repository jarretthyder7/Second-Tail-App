import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

/**
 * Dynamic Open Graph image for /rescuespinner.
 * Served at /rescuespinner-og (via the route folder name).
 * Uses the Second Tail logo from /logo.svg and Lora font for the headline.
 */
async function loadGoogleFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await fetch(url, {
    headers: {
      // Older UA forces Google Fonts to serve TTF (Satori needs TTF, not woff2).
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
    },
  }).then((r) => r.text())
  const match = css.match(/src: url\(([^)]+)\) format\(('truetype'|'opentype')\)/)
  if (!match) throw new Error('Could not extract font TTF URL from Google CSS')
  const fontData = await fetch(match[1]).then((r) => r.arrayBuffer())
  return fontData
}

export async function GET() {
  const headlineText = 'Toss a bone.Meet a rescue dog.'
  const brandText = 'Second Tail'

  let loraBold: ArrayBuffer | null = null
  try {
    loraBold = await loadGoogleFont('Lora', 700, headlineText + brandText)
  } catch {
    // Fall back to system fonts if Google Fonts is unreachable
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          background:
            'radial-gradient(circle at 85% 15%, #F3E0B0 0%, #EBE0CC 45%, #E5D8C0 100%)',
          fontFamily: loraBold
            ? 'Lora, system-ui, -apple-system, sans-serif'
            : 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Brand row with Second Tail logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <img
            src="https://getsecondtail.com/logo.svg"
            width={64}
            height={64}
            alt=""
            style={{ display: 'block' }}
          />
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#4A3C36',
              letterSpacing: '-0.01em',
              fontFamily: loraBold
                ? 'Lora, serif'
                : 'system-ui, -apple-system, sans-serif',
            }}
          >
            {brandText}
          </div>
        </div>

        {/* Headline + subtitle */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 28,
          }}
        >
          <div
            style={{
              fontSize: 108,
              fontWeight: 700,
              color: '#1F1B18',
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: loraBold
                ? 'Lora, serif'
                : 'system-ui, -apple-system, sans-serif',
            }}
          >
            <span>Toss a bone.</span>
            <span>Meet a rescue dog.</span>
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#4A3C36',
              lineHeight: 1.3,
              maxWidth: 980,
              letterSpacing: '-0.005em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Real dogs from real rescues across the US — looking for a foster
            home or forever family.
          </div>
        </div>

        {/* Footer row: domain + bone illustration */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: '#D76B1A',
              fontWeight: 600,
              letterSpacing: '-0.005em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            getsecondtail.com/rescuespinner
          </div>
          <svg width="130" height="70" viewBox="0 0 130 70">
            <path
              d="M22 15 C14 15 9 20 9 28 C9 32 11 35 14 37 C11 39 9 42 9 46 C9 54 14 60 22 60 C30 60 35 54 35 46 L95 46 C95 54 100 60 108 60 C116 60 121 54 121 46 C121 42 119 39 116 37 C119 35 121 32 121 28 C121 20 116 15 108 15 C100 15 95 20 95 28 L35 28 C35 20 30 15 22 15 Z"
              fill="#D76B1A"
              opacity="0.92"
            />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: loraBold
        ? [
            {
              name: 'Lora',
              data: loraBold,
              weight: 700,
              style: 'normal',
            },
          ]
        : undefined,
    }
  )
}
