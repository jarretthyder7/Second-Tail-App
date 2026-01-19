-- Create foster_profiles table to store extended foster information
CREATE TABLE IF NOT EXISTS foster_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Contact Information
  phone TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- Home & Lifestyle
  housing_type TEXT, -- 'house', 'apartment', 'condo', 'other'
  has_yard BOOLEAN,
  has_pets BOOLEAN,
  existing_pets_description TEXT,
  household_members INTEGER,
  schedule_flexibility TEXT, -- 'very_flexible', 'somewhat_flexible', 'limited'
  
  -- Foster Preferences
  comfort_level TEXT, -- 'first_time', 'some_experience', 'very_experienced'
  preferred_dog_sizes TEXT[], -- ['small', 'medium', 'large']
  preferred_dog_ages TEXT[], -- ['puppy', 'young', 'adult', 'senior']
  open_to_special_needs BOOLEAN DEFAULT false,
  max_foster_duration TEXT, -- 'short_term', 'medium_term', 'long_term', 'flexible'
  
  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE foster_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own foster profile
CREATE POLICY "Users can view their own foster profile"
  ON foster_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own foster profile
CREATE POLICY "Users can insert their own foster profile"
  ON foster_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own foster profile
CREATE POLICY "Users can update their own foster profile"
  ON foster_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Rescue admins can view foster profiles in their organization
CREATE POLICY "Rescue admins can view foster profiles"
  ON foster_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'rescue'
      AND profiles.organization_id IN (
        SELECT organization_id FROM profiles WHERE profiles.id = foster_profiles.user_id
      )
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_foster_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER foster_profiles_updated_at
  BEFORE UPDATE ON foster_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_foster_profiles_updated_at();
