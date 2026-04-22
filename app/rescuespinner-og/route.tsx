import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

/**
 * Open Graph image for /rescuespinner — just the Second Tail logo, centered.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 50% 50%, #F3E0B0 0%, #EBE0CC 55%, #E5D8C0 100%)',
        }}
      >
        <img
          src="https://getsecondtail.com/logo.svg"
          width={420}
          height={420}
          alt=""
          style={{ display: 'block' }}
        />
      </div>
    ),
    { ...size }
  )
}
