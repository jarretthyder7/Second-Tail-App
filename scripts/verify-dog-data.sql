-- Comprehensive diagnostic script to verify dog data and RLS policies
-- Run this script to debug the dog profile loading issue

-- Step 1: Verify Kona exists in the database
SELECT 
  id, 
  name, 
  breed, 
  status, 
  foster_id,
  organization_id,
  image_url,
  created_at,
  updated_at
FROM dogs
WHERE id = '6e7a7fcc-d134-4ea5-8e2b-63571d37fb00';

-- Step 2: Check all dogs in Second Tail organization
SELECT 
  id,
  name,
  breed,
  status,
  foster_id,
  organization_id
FROM dogs
WHERE organization_id = 'b03ba4c7-d3fc-4fa1-a3a3-dd33c399d3ea';

-- Step 3: Check RLS policies on dogs table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as qualifying_condition
FROM pg_policies
WHERE tablename = 'dogs'
ORDER BY policyname;

-- Step 4: Verify foster assignment
SELECT 
  d.id as dog_id,
  d.name as dog_name,
  d.foster_id,
  p.id as foster_profile_id,
  p.name as foster_name,
  p.email as foster_email,
  p.role as foster_role
FROM dogs d
LEFT JOIN profiles p ON p.id = d.foster_id
WHERE d.id = '6e7a7fcc-d134-4ea5-8e2b-63571d37fb00';

-- Step 5: Check if service role bypasses RLS (this should return TRUE)
SELECT current_setting('is_superuser');
