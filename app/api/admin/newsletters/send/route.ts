import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { renderNewsletterTemplate } from '@/lib/email/newsletter-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      orgId, 
      sections, 
      subject, 
      scheduleFor,
      recipientType = 'all_fosters' // 'all_fosters' | 'active_fosters' | 'custom'
    } = body

    if (!orgId || !sections || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get organization details for branding
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, logo_url, primary_color')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // If scheduling for later, just store in database
    if (scheduleFor && new Date(scheduleFor) > new Date()) {
      const { data: newsletter, error: insertError } = await supabase
        .from('newsletters')
        .insert({
          org_id: orgId,
          subject,
          sections,
          status: 'scheduled',
          scheduled_for: scheduleFor,
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[v0] Error scheduling newsletter:', insertError)
        return NextResponse.json({ error: 'Failed to schedule newsletter' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Newsletter scheduled successfully',
        newsletter 
      })
    }

    // Get foster recipients based on recipientType
    let fostersQuery = supabase
      .from('fosters')
      .select('id, email, name')
      .eq('org_id', orgId)

    if (recipientType === 'active_fosters') {
      // Only fosters who currently have animals
      const { data: activeFosters } = await supabase
        .from('dogs')
        .select('foster_id')
        .eq('org_id', orgId)
        .not('foster_id', 'is', null)

      const activeFosterIds = activeFosters?.map(d => d.foster_id) || []
      fostersQuery = fostersQuery.in('id', activeFosterIds)
    }

    const { data: fosters, error: fostersError } = await fostersQuery

    if (fostersError) {
      console.error('[v0] Error fetching fosters:', fostersError)
      return NextResponse.json({ error: 'Failed to fetch fosters' }, { status: 500 })
    }

    if (!fosters || fosters.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    // Create newsletter record
    const { data: newsletter, error: insertError } = await supabase
      .from('newsletters')
      .insert({
        org_id: orgId,
        subject,
        sections,
        status: 'sending',
        sent_at: new Date().toISOString(),
        recipient_count: fosters.length,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[v0] Error creating newsletter:', insertError)
      return NextResponse.json({ error: 'Failed to create newsletter' }, { status: 500 })
    }

    // Render email template
    const emailHtml = renderNewsletterTemplate({
      orgName: org.name,
      orgLogo: org.logo_url,
      primaryColor: org.primary_color || '#D76B1A',
      sections,
      footerText: `You're receiving this because you're part of the ${org.name} foster network.`
    })

    // Send emails via Resend
    const emailPromises = fosters.map(async (foster) => {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.FROM_EMAIL || `${org.name} <updates@fosterpaws.com>`,
          to: foster.email,
          subject,
          html: emailHtml,
        })

        // Track recipient status
        await supabase
          .from('newsletter_recipients')
          .insert({
            newsletter_id: newsletter.id,
            foster_id: foster.id,
            email: foster.email,
            status: error ? 'failed' : 'sent',
            sent_at: new Date().toISOString(),
            error_message: error?.message,
          })

        return { success: !error, email: foster.email, error }
      } catch (err) {
        console.error('[v0] Error sending to', foster.email, err)
        return { success: false, email: foster.email, error: err }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    // Update newsletter status
    await supabase
      .from('newsletters')
      .update({
        status: failureCount > 0 ? 'partial' : 'sent',
        success_count: successCount,
        failure_count: failureCount,
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
      }
    })

  } catch (error) {
    console.error('[v0] Newsletter send error:', error)
    return NextResponse.json({ 
      error: 'Failed to send newsletter',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
