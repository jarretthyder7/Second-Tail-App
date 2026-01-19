-- Create appointments table for scheduling meetings, visits, and check-ins
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('vet_visit', 'home_check', 'drop_off', 'pick_up', 'training', 'meet_and_greet', 'foster_check_in', 'team_meeting', 'other')),
  
  -- Time details
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Related entities
  dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
  foster_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Staff member responsible
  
  -- Location and logistics
  location TEXT,
  items_needed TEXT[], -- Array of items foster should bring
  
  -- Status and tracking
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  reminder_sent BOOLEAN DEFAULT false,
  
  -- External calendar integration
  google_calendar_event_id TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cancellation_reason TEXT
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_appointments_org ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dog ON appointments(dog_id);
CREATE INDEX IF NOT EXISTS idx_appointments_foster ON appointments(foster_id);
CREATE INDEX IF NOT EXISTS idx_appointments_team ON appointments(team_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- RLS Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Rescue staff can manage all appointments in their org
CREATE POLICY "Rescue users can manage appointments" ON appointments
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'rescue'
    )
  );

-- Foster users can view their own appointments
CREATE POLICY "Foster users can view their appointments" ON appointments
  FOR SELECT
  USING (
    foster_id = auth.uid()
    OR
    dog_id IN (
      SELECT id FROM dogs WHERE foster_id = auth.uid()
    )
  );

-- Foster users can update appointment status (confirm/cancel)
CREATE POLICY "Foster users can update their appointment status" ON appointments
  FOR UPDATE
  USING (foster_id = auth.uid())
  WITH CHECK (foster_id = auth.uid());
