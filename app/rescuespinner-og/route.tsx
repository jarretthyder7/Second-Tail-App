import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

/**
 * Minimal Open Graph image for /rescuespinner.
 * Centered: Second Tail logo + "Second Tail" in Lora serif.
 */
async function loadGoogleFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
    },
  }).then((r) => r.text())
  const match = css.match(/src: url\(([^)]+)\) format\(('truetype'|'opentype')\)/)
  if (!match) throw new Error('Could not extract font TTF URL')
  return await fetch(match[1]).then((r) => r.arrayBuffer())
}

export async function GET() {
  const brand = 'Second Tail'

  let loraBold: ArrayBuffer | null = null
  try {
    loraBold = await loadGoogleFont('Lora', 700, brand)
  } catch {
    // Fall back to system serif if Google Fonts is unreachable.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
          background:
            'radial-gradient(circle at 50% 50%, #F3E0B0 0%, #EBE0CC 55%, #E5D8C0 100%)',
          fontFamily: loraBold
            ? 'Lora, serif'
            : 'Georgia, "Times New Roman", serif',
        }}
      >
        <img
          src="https://getsecondtail.com/logo.svg"
          width={280}
          height={280}
          alt=""
          style={{ display: 'block' }}
        />
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#2E2420',
            letterSpacing: '-0.02em',
            fontFamily: loraBold
              ? 'Lora, serif'
              : 'Georgia, "Times New Roman", serif',
          }}
        >
          {brand}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: loraBold
        ? [{ name: 'Lora', data: loraBold, weight: 700, style: 'normal' }]
        : undefined,
    }
  )
}
