-- Adds pickup-tracking columns to help_requests so the rescue can confirm a
-- supply request and tell the foster when/where to pick up.
--
-- Idempotent: safe to re-run.

ALTER TABLE help_requests
  ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pickup_location TEXT,
  ADD COLUMN IF NOT EXISTS pickup_notes TEXT,
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN help_requests.pickup_time IS 'When the foster should pick up the supplies (set by rescue on Acknowledge)';
COMMENT ON COLUMN help_requests.pickup_location IS 'Address / location where the foster picks up supplies';
COMMENT ON COLUMN help_requests.pickup_notes IS 'Free-form pickup instructions (e.g. "ring doorbell twice")';
COMMENT ON COLUMN help_requests.acknowledged_by IS 'Rescue staff member who acknowledged the request';
COMMENT ON COLUMN help_requests.acknowledged_at IS 'Timestamp when the request was acknowledged';
