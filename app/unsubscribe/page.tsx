import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token'

// Server component — runs on every request. No caching.
export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ t?: string }>

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FDF6EC',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          background: 'white',
          borderRadius: 16,
          padding: '40px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { t } = await searchParams

  if (!t) {
    return (
      <Shell>
        <h1 style={{ color: '#5A4A42', margin: '0 0 12px' }}>Invalid link</h1>
        <p style={{ color: '#6B5B4F', margin: 0 }}>
          This unsubscribe link is missing or malformed. If you received this
          link in an email, please reply to that email and ask to be removed.
        </p>
      </Shell>
    )
  }

  const verified = verifyUnsubscribeToken(t)
  if (!verified) {
    return (
      <Shell>
        <h1 style={{ color: '#5A4A42', margin: '0 0 12px' }}>Invalid link</h1>
        <p style={{ color: '#6B5B4F', margin: 0 }}>
          This unsubscribe link looks tampered with or expired. Please reply
          directly to the email you received and ask to be removed.
        </p>
      </Shell>
    )
  }

  // Use service role to bypass RLS for the insert.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error } = await supabase
    .from('newsletter_unsubscribes')
    .upsert(
      {
        organization_id: verified.orgId,
        email: verified.email,
        source: 'email_link',
      },
      { onConflict: 'organization_id,email' }
    )

  if (error) {
    return (
      <Shell>
        <h1 style={{ color: '#5A4A42', margin: '0 0 12px' }}>
          Something went wrong
        </h1>
        <p style={{ color: '#6B5B4F', margin: 0 }}>
          We couldn&apos;t record your unsubscribe right now. Please reply to
          the email you received and we&apos;ll remove you manually.
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
      <h1 style={{ color: '#5A4A42', margin: '0 0 12px' }}>You&apos;re unsubscribed</h1>
      <p style={{ color: '#6B5B4F', margin: 0, lineHeight: 1.6 }}>
        <strong>{verified.email}</strong> will no longer receive newsletters
        from this rescue.
      </p>
    </Shell>
  )
}
