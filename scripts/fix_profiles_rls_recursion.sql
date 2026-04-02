-- Fix infinite recursion in profiles RLS policies
-- The three policies below cause recursion by querying `profiles` from within a `profiles` policy.
-- Solution: create a security definer function that reads the current user's profile
-- bypassing RLS, then rewrite the offending policies to use it.

-- Step 1: Create helper functions (SECURITY DEFINER bypasses RLS, no recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Step 2: Drop the three recursive policies
DROP POLICY IF EXISTS "batch_c_profiles_select_org_members_rescue" ON public.profiles;
DROP POLICY IF EXISTS "batch_c_profiles_select_org_peers_foster" ON public.profiles;
DROP POLICY IF EXISTS "batch_c_profiles_rescue_update_org_fosters" ON public.profiles;

-- Step 3: Recreate them using the helper functions (no more recursion)

-- Rescue users can see all profiles in their org
CREATE POLICY "batch_c_profiles_select_org_members_rescue"
ON public.profiles FOR SELECT
USING (
  public.get_my_role() = 'rescue'
  AND public.get_my_organization_id() IS NOT NULL
  AND public.get_my_organization_id() = organization_id
);

-- Foster users can see other profiles in their org
CREATE POLICY "batch_c_profiles_select_org_peers_foster"
ON public.profiles FOR SELECT
USING (
  public.get_my_role() = 'foster'
  AND public.get_my_organization_id() IS NOT NULL
  AND public.get_my_organization_id() = organization_id
);

-- Rescue users can update foster profiles in their org
CREATE POLICY "batch_c_profiles_rescue_update_org_fosters"
ON public.profiles FOR UPDATE
USING (
  public.get_my_role() = 'rescue'
  AND public.get_my_organization_id() IS NOT NULL
  AND public.get_my_organization_id() = organization_id
  AND role = 'foster'
);
