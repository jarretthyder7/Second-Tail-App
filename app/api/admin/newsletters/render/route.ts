import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderNewsletterTemplate } from '@/lib/email/newsletter-template'

/**
 * Render a newsletter to HTML string for client-side preview + export.
 * Same renderer the send route uses, so preview = export = sent email.
 * Does NOT include a per-recipient unsubscribe URL (that's generated per
 * recipient in the send loop).
 */
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
    const { orgId, sections } = body

    if (!orgId || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Missing orgId or sections' },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_role, organization_id')
      .eq('id', user.id)
      .single()

    if (
      !profile ||
      profile.organization_id !== orgId ||
      profile.org_role !== 'org_admin'
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

    const html = renderNewsletterTemplate({
      orgName: org.name,
      orgLogo: org.logo_url || undefined,
      primaryColor: org.primary_color || '#D76B1A',
      sections,
      footerText: `You're receiving this because you're part of the ${org.name} foster network.`,
      // Placeholder unsubscribe link — export users can replace with their
      // own list's unsub handling if they upload to Mailchimp etc.
      unsubscribeUrl: undefined,
    })

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Failed to render newsletter',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
