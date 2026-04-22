import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

/**
 * Dynamic Open Graph image for /rescuespinner.
 * Served at /rescuespinner-og (via the route folder name).
 */
export async function GET() {
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
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Brand row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: '#D76B1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(215,107,26,0.3)',
            }}
          >
            {/* Paw shape in white */}
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <circle cx="5" cy="9" r="2.2" />
              <circle cx="9" cy="5.5" r="2.2" />
              <circle cx="15" cy="5.5" r="2.2" />
              <circle cx="19" cy="9" r="2.2" />
              <path d="M12 10.5c-3 0-6 2.5-6 5.5 0 2.2 1.8 3.5 3.8 3.5 1 0 1.7-.5 2.2-.5s1.2.5 2.2.5c2 0 3.8-1.3 3.8-3.5 0-3-3-5.5-6-5.5z" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#4A3C36',
              letterSpacing: '-0.01em',
            }}
          >
            Second Tail
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
              fontSize: 104,
              fontWeight: 800,
              color: '#1F1B18',
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              display: 'flex',
              flexDirection: 'column',
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
              maxWidth: 960,
              letterSpacing: '-0.005em',
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
            }}
          >
            getsecondtail.com/rescuespinner
          </div>
          {/* Stylized bone */}
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
    }
  )
}
