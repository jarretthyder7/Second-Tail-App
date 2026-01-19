-- Create reimbursements table
CREATE TABLE IF NOT EXISTS reimbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foster_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
  
  -- Expense details
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL, -- 'vet_care', 'food', 'supplies', 'transport', 'grooming', 'other'
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT, -- URL to uploaded receipt
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid'
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  payment_date DATE,
  payment_method TEXT, -- 'check', 'venmo', 'paypal', 'direct_deposit', etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reimbursements_foster ON reimbursements(foster_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_org ON reimbursements(organization_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON reimbursements(status);
CREATE INDEX IF NOT EXISTS idx_reimbursements_dog ON reimbursements(dog_id);

-- Enable RLS
ALTER TABLE reimbursements ENABLE ROW LEVEL SECURITY;

-- Foster users can view their own reimbursements
CREATE POLICY "Foster users can view their own reimbursements"
ON reimbursements FOR SELECT
TO authenticated
USING (
  foster_id = auth.uid()
);

-- Foster users can insert their own reimbursements
CREATE POLICY "Foster users can insert their own reimbursements"
ON reimbursements FOR INSERT
TO authenticated
WITH CHECK (
  foster_id = auth.uid()
);

-- Foster users can update their pending reimbursements
CREATE POLICY "Foster users can update their pending reimbursements"
ON reimbursements FOR UPDATE
TO authenticated
USING (
  foster_id = auth.uid() AND status = 'pending'
);

-- Rescue admins can view all reimbursements in their organization
CREATE POLICY "Rescue admins can view org reimbursements"
ON reimbursements FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = reimbursements.organization_id
    AND profiles.role = 'rescue'
  )
);

-- Rescue admins can update reimbursements in their organization
CREATE POLICY "Rescue admins can update org reimbursements"
ON reimbursements FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = reimbursements.organization_id
    AND profiles.role = 'rescue'
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reimbursements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reimbursements_updated_at
BEFORE UPDATE ON reimbursements
FOR EACH ROW
EXECUTE FUNCTION update_reimbursements_updated_at();
