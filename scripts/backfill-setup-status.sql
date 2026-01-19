-- Backfill setup status for existing organizations created before this feature
INSERT INTO organization_setup_status (organization_id, setup_step_id, is_completed, created_at, updated_at)
SELECT 
  org.id,
  step.step_id,
  CASE 
    WHEN step.step_id = 'org_profile' THEN true
    ELSE false
  END as is_completed,
  NOW(),
  NOW()
FROM organizations org
CROSS JOIN (
  SELECT 'org_profile' as step_id
  UNION ALL SELECT 'help_settings'
  UNION ALL SELECT 'first_dog'
  UNION ALL SELECT 'invite_foster'
  UNION ALL SELECT 'create_team'
  UNION ALL SELECT 'care_plan'
  UNION ALL SELECT 'first_message'
  UNION ALL SELECT 'first_appointment'
) step
WHERE NOT EXISTS (
  SELECT 1 FROM organization_setup_status 
  WHERE organization_id = org.id 
  AND setup_step_id = step.step_id
);
