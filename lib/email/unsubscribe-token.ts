import crypto from 'crypto'

function getSecret(): string {
  // Prefer a dedicated secret, fall back to Supabase service-role key which
  // always exists in deployment. Either way it's server-only.
  const s =
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!s) {
    throw new Error(
      'Missing unsubscribe secret: set NEWSLETTER_UNSUBSCRIBE_SECRET (or SUPABASE_SERVICE_ROLE_KEY).'
    )
  }
  return s
}

function toB64Url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf, 'utf-8') : buf
  return b
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromB64Url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

/**
 * Sign an unsubscribe payload. Output shape: `<payloadB64Url>.<sigB64Url>`
 * Keep tokens short — they go into email URLs.
 */
export function signUnsubscribeToken(email: string, orgId: string): string {
  const payload = `${email}|${orgId}`
  const payloadB64 = toB64Url(payload)
  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(payloadB64)
    .digest()
  return `${payloadB64}.${toB64Url(sig)}`
}

export function verifyUnsubscribeToken(
  token: string
): { email: string; orgId: string } | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts

  let expected: Buffer
  try {
    expected = crypto
      .createHmac('sha256', getSecret())
      .update(payloadB64)
      .digest()
  } catch {
    return null
  }

  let provided: Buffer
  try {
    provided = fromB64Url(sigB64)
  } catch {
    return null
  }

  if (expected.length !== provided.length) return null
  if (!crypto.timingSafeEqual(expected, provided)) return null

  const payload = fromB64Url(payloadB64).toString('utf-8')
  const [email, orgId] = payload.split('|')
  if (!email || !orgId) return null
  return { email, orgId }
}

export function buildUnsubscribeUrl(
  baseUrl: string,
  email: string,
  orgId: string
): string {
  const token = signUnsubscribeToken(email, orgId)
  const u = new URL('/unsubscribe', baseUrl)
  u.searchParams.set('t', token)
  return u.toString()
}
