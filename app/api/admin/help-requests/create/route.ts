import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile to verify rescue role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'rescue') {
    return NextResponse.json(
      { error: 'Only rescue staff can create support requests' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const {
      organization_id,
      foster_id,
      dog_id,
      category,
      priority,
      title,
      description,
      assigned_team_id,
      assigned_staff_id,
      create_appointment,
    } = body

    // Validate required fields
    if (!organization_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    if (!dog_id && !foster_id) {
      return NextResponse.json(
        { error: 'Either animal or foster must be specified' },
        { status: 400 }
      )
    }

    // Create the help request
    const { data: helpRequest, error: helpRequestError } = await supabase
      .from('help_requests')
      .insert({
        foster_id: foster_id || null,
        dog_id: dog_id || null,
        category,
        priority,
        title,
        description,
        status: 'open',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (helpRequestError) {
      console.error('[v0] Error creating help request:', helpRequestError)
      return NextResponse.json({ error: helpRequestError.message }, { status: 500 })
    }

    let appointmentId = null

    // Create appointment if requested (for appointment-type requests)
    if (create_appointment && category === 'appointment') {
      const { start_time, location } = create_appointment

      if (start_time) {
        const { data: appointment, error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            organization_id,
            foster_id: foster_id || null,
            dog_id: dog_id || null,
            title: title || 'Scheduled Appointment',
            description,
            start_time,
            end_time: new Date(new Date(start_time).getTime() + 60 * 60 * 1000).toISOString(), // +1 hour
            location: location || '',
            status: 'scheduled',
            appointment_type: 'other',
            assigned_to: assigned_staff_id || null,
            team_id: assigned_team_id || null,
            created_by: user.id,
          })
          .select()
          .single()

        if (appointmentError) {
          console.warn('[v0] Failed to create appointment:', appointmentError)
        } else {
          appointmentId = appointment?.id
          console.log('[v0] Created appointment:', appointmentId)
        }
      }
    }

    return NextResponse.json({
      helpRequest,
      appointmentId,
      message: 'Support request created successfully',
    })
  } catch (error) {
    console.error('[v0] Error in create support request API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
