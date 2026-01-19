-- Create table to track onboarding progress for rescue organizations
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own onboarding progress
CREATE POLICY "Users can view their own onboarding progress"
  ON onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own onboarding progress
CREATE POLICY "Users can insert their own onboarding progress"
  ON onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own onboarding progress
CREATE POLICY "Users can update their own onboarding progress"
  ON onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_onboarding_progress_org_user ON onboarding_progress(organization_id, user_id);
CREATE INDEX idx_onboarding_progress_completed ON onboarding_progress(is_completed);
