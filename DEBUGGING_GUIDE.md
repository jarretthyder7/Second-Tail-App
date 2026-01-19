# Dog Profile Loading Issue - Debugging Guide

## Issue Description
Dog profiles with ID '6e7a7fcc-d134-4ea5-8e2b-63571d37fb00' (Kona) show "Dog not found" error on both rescue admin and foster dashboards on the deployed site, but work correctly in v0 preview.

## Root Cause Analysis
The service role client is not properly bypassing RLS policies on the deployed site, causing all database queries to return empty results.

## Key Debugging Steps

### 1. Verify Environment Variables
Check that the following environment variables are set on your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (CRITICAL)

### 2. Check Database Connectivity
Run the diagnostic SQL script `/scripts/verify-dog-data.sql` to:
- Verify the dog record exists
- Check RLS policies
- Verify foster assignments
- Confirm service role permissions

### 3. Test API Route Directly
Test the API route directly in your browser or with curl:
\`\`\`bash
curl https://your-domain.com/api/dogs/6e7a7fcc-d134-4ea5-8e2b-63571d37fb00
\`\`\`

Expected response: JSON object with dog data
Error response: Check browser console and server logs

### 4. Review Server Logs
Check your deployment platform's logs for:
- `[v0] [API /api/dogs/[id]]` - API route execution logs
- `[v0] [Service Role Client]` - Service role client creation logs
- Any error messages about missing environment variables

### 5. Verify RLS Policies
Ensure RLS policies on the `dogs` table allow:
- Service role to bypass all policies
- Authenticated users to read dogs in their organization
- Foster users to read their assigned dogs

## Common Issues & Solutions

### Issue 1: Missing Service Role Key
**Symptom:** Error "SUPABASE_SERVICE_ROLE_KEY is not defined"
**Solution:** Add the service role key to your deployment environment variables

### Issue 2: RLS Blocking Queries
**Symptom:** Queries return empty results even though data exists
**Solution:** Verify service role client is being used in API routes, not regular client

### Issue 3: Wrong URL Structure
**Symptom:** 404 errors or "Dog not found" immediately
**Solution:** Verify URL structure matches: `/org/[orgId]/admin/dogs/[dogId]`

### Issue 4: CORS or Network Errors
**Symptom:** "Failed to fetch" errors in console
**Solution:** Check network tab for actual HTTP status codes and responses

## Reproduction Steps
1. Navigate to rescue admin portal
2. Go to Fosters page: `/org/b03ba4c7-d3fc-4fa1-a3a3-dd33c399d3ea/admin/fosters`
3. Click "View Kona's Profile" or navigate to dog profile directly
4. Expected: Dog profile loads with data
5. Actual (on live site): "Dog Not Found" error

## Resolution Checklist
- [ ] Verify SUPABASE_SERVICE_ROLE_KEY is set in deployment environment
- [ ] Confirm service role key has correct permissions
- [ ] Run diagnostic SQL script to verify data exists
- [ ] Check server logs for specific error messages
- [ ] Test API route directly
- [ ] Verify RLS policies allow service role access
- [ ] Clear deployment cache and redeploy if needed
- [ ] Test on both admin and foster portals

## Files Involved
- `/app/api/dogs/[id]/route.ts` - API route for fetching dog data
- `/lib/supabase/server.ts` - Service role client configuration
- `/app/org/[orgId]/admin/dogs/[id]/page.tsx` - Admin dog profile page
- `/app/org/[orgId]/foster/dog/[id]/page.tsx` - Foster dog profile page
