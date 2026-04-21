import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { renderNewsletterTemplate } from '@/lib/email/newsletter-template'
import { buildUnsubscribeUrl } from '@/lib/email/unsubscribe-token'

const resend = new Resend(process.env.RESEND_API_KEY)

const SEND_DELAY_MS = 150 // ~6.6 sends/sec — stays under Resend's 10/sec free tier

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      orgId,
      sections,
      subject,
      scheduleFor,
      recipientType = 'all_fosters',
    } = body

    if (!orgId || !sections || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Scheduling is not implemented — there is no cron worker that picks up
    // scheduled rows yet. Reject explicitly instead of silently storing.
    if (scheduleFor && new Date(scheduleFor) > new Date()) {
      return NextResponse.json(
        {
          error:
            'Scheduled sending is not available yet. Please send now or save a draft.',
        },
        { status: 501 }
      )
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, org_role, organization_id')
      .eq('id', user.id)
      .single()

    if (
      !userProfile ||
      userProfile.organization_id !== orgId ||
      userProfile.org_role !== 'org_admin'
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Not an admin of this organization' },
        { status: 403 }
      )
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, logo_url, primary_color')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Fetch recipients
    let fostersQuery = supabase
      .from('profiles')
      .select('id, email, name')
      .eq('role', 'foster')
      .eq('organization_id', orgId)

    if (recipientType === 'active_fosters') {
      const { data: activeFosters } = await supabase
        .from('dogs')
        .select('foster_id')
        .eq('organization_id', orgId)
        .not('foster_id', 'is', null)

      const activeFosterIds = activeFosters?.map((d) => d.foster_id) || []
      fostersQuery = fostersQuery.in('id', activeFosterIds)
    }

    const { data: fosters, error: fostersError } = await fostersQuery

    if (fostersError) {
      return NextResponse.json(
        { error: 'Failed to fetch fosters' },
        { status: 500 }
      )
    }

    if (!fosters || fosters.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    // Filter out unsubscribed emails. Fail open if table doesn't exist yet
    // (so send still works before migration is run) — we log and proceed.
    let unsubscribedEmails: Set<string> = new Set()
    try {
      const { data: unsubs } = await supabase
        .from('newsletter_unsubscribes')
        .select('email')
        .eq('organization_id', orgId)
      if (unsubs) {
        unsubscribedEmails = new Set(
          unsubs.map((u) => String(u.email).toLowerCase())
        )
      }
    } catch {
      // table may not exist yet — fail open
    }

    const recipients = fosters.filter(
      (f) => f.email && !unsubscribedEmails.has(String(f.email).toLowerCase())
    )

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'All potential recipients have unsubscribed.' },
        { status: 400 }
      )
    }

    // Create newsletter record
    const { data: newsletter, error: insertError } = await supabase
      .from('newsletters')
      .insert({
        organization_id: orgId,
        subject,
        sections,
        status: 'sending',
        sent_at: new Date().toISOString(),
        recipient_count: recipients.length,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create newsletter' },
        { status: 500 }
      )
    }

    // Determine base URL for unsubscribe links
    const origin =
      request.headers.get('origin') ||
      `https://${request.headers.get('host') || 'getsecondtail.com'}`

    // Sequential send with delay to respect Resend rate limits.
    const results: Array<{ success: boolean; email: string; error?: string }> =
      []
    for (const foster of recipients) {
      try {
        const unsubUrl = buildUnsubscribeUrl(origin, foster.email, orgId)
        const emailHtml = renderNewsletterTemplate({
          orgName: org.name,
          orgLogo: org.logo_url || undefined,
          primaryColor: org.primary_color || '#D76B1A',
          sections,
          footerText: `You're receiving this because you're part of the ${org.name} foster network.`,
          unsubscribeUrl: unsubUrl,
        })

        const { error } = await resend.emails.send({
          from: process.env.FROM_EMAIL || 'noreply@getsecondtail.com',
          to: foster.email,
          subject,
          html: emailHtml,
          headers: {
            // RFC 8058 one-click unsubscribe — mail clients honor this.
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })

        await supabase.from('newsletter_recipients').insert({
          newsletter_id: newsletter.id,
          foster_id: foster.id,
          email: foster.email,
          status: error ? 'failed' : 'sent',
          sent_at: new Date().toISOString(),
          error_message: error?.message,
        })

        results.push({
          success: !error,
          email: foster.email,
          error: error?.message,
        })
      } catch (err) {
        results.push({
          success: false,
          email: foster.email,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }

      if (recipients.length > 1) await wait(SEND_DELAY_MS)
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.length - successCount

    await supabase
      .from('newsletters')
      .update({
        status: failureCount > 0 ? 'partial' : 'sent',
        recipient_count: successCount,
        sent_at: new Date().toISOString(),
      })
      .eq('id', newsletter.id)

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${successCount} of ${results.length} recipients`,
      newsletter,
      stats: {
        total: results.length,
        success: successCount,
        failed: failureCount,
        skipped_unsubscribed: fosters.length - recipients.length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to send newsletter',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
