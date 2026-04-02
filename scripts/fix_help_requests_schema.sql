-- Make dog_id nullable (fosters without an assigned dog should still be able to submit requests)
ALTER TABLE public.help_requests ALTER COLUMN dog_id DROP NOT NULL;

-- Add organization_id column so requests are directly tied to an org
ALTER TABLE public.help_requests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Backfill organization_id from the foster's profile for existing rows
UPDATE public.help_requests hr
SET organization_id = p.organization_id
FROM public.profiles p
WHERE p.id = hr.foster_id
  AND hr.organization_id IS NULL;

-- Add index for efficient org-based queries
CREATE INDEX IF NOT EXISTS help_requests_organization_id_idx ON public.help_requests(organization_id);
CREATE INDEX IF NOT EXISTS help_requests_category_status_idx ON public.help_requests(category, status);
