-- Create team_messages table for internal team chat
CREATE TABLE IF NOT EXISTS team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_messages_team_id ON team_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_sender_id ON team_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON team_messages(created_at DESC);

-- Enable RLS
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Staff can view messages from teams they belong to
CREATE POLICY "Team members can view messages" ON team_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_messages.team_id 
      AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.org_role = 'org_admin'
      AND profiles.organization_id = (
        SELECT organization_id FROM teams WHERE teams.id = team_messages.team_id
      )
    )
  );

-- Staff can send messages to teams they belong to
CREATE POLICY "Team members can send messages" ON team_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = team_messages.team_id 
        AND team_members.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.org_role = 'org_admin'
        AND profiles.organization_id = (
          SELECT organization_id FROM teams WHERE teams.id = team_messages.team_id
        )
      )
    )
  );
