-- Backfill dogs.stage from dogs.status for any rows where stage is null.
-- The codebase has migrated to `stage` as the canonical lifecycle field.
-- We deliberately do NOT touch dogs.status here — that column has a CHECK
-- constraint expecting legacy values (`fostered`, `medical-hold`, etc.)
-- and writing our new canonical snake_case values would violate it.
-- The legacy status column is read with a fallback in code; just leave it.
--
-- Idempotent — safe to re-run.

UPDATE dogs
SET stage = CASE
  WHEN status = 'available' THEN 'available'
  WHEN status = 'fostered' THEN 'in_foster'
  WHEN status = 'in_foster' THEN 'in_foster'
  WHEN status = 'adopted' THEN 'adopted'
  WHEN status = 'medical-hold' THEN 'medical_hold'
  WHEN status = 'medical_hold' THEN 'medical_hold'
  WHEN status = 'pending_adoption' THEN 'adoption_pending'
  WHEN status = 'adoption_pending' THEN 'adoption_pending'
  WHEN status = 'on_hold' THEN 'on_hold'
  WHEN status = 'evaluation' THEN 'evaluation'
  WHEN status = 'returned' THEN 'returned'
  WHEN status = 'intake' THEN 'intake'
  ELSE COALESCE(status, 'intake')
END
WHERE stage IS NULL OR stage = '';

-- Normalize any existing stage values that have legacy formatting
-- (e.g. "medical-hold" with a hyphen instead of underscore).
UPDATE dogs SET stage = 'medical_hold' WHERE stage = 'medical-hold';
UPDATE dogs SET stage = 'adoption_pending' WHERE stage = 'pending_adoption';
UPDATE dogs SET stage = 'in_foster' WHERE stage = 'fostered';
