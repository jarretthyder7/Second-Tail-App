-- Create timeline_events table for animal profile timeline
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'intake',
    'status_change',
    'foster_assigned',
    'foster_ended',
    'appointment_scheduled',
    'appointment_completed',
    'medical_update',
    'file_uploaded',
    'reimbursement_update',
    'supply_request',
    'internal_note_added',
    'team_assignment',
    'manual'
  )),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  visible_to_foster BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_timeline_events_animal_id ON timeline_events(animal_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_event_date ON timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_events_type ON timeline_events(type);

-- Enable RLS
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view timeline events in their organization"
ON timeline_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dogs
    JOIN profiles ON profiles.organization_id = dogs.organization_id
    WHERE dogs.id = timeline_events.animal_id
    AND profiles.id = auth.uid()
  )
);

CREATE POLICY "Rescue users can manage timeline events"
ON timeline_events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM dogs
    JOIN profiles ON profiles.organization_id = dogs.organization_id
    WHERE dogs.id = timeline_events.animal_id
    AND profiles.id = auth.uid()
    AND profiles.role = 'rescue'
  )
);

COMMIT;
