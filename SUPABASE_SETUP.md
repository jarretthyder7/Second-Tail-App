# Supabase Google OAuth Setup Guide

This guide explains how to enable Google OAuth authentication in your Second Tail Foster Portal app.

## Prerequisites

- A Supabase project (already connected via v0)
- A Google Cloud Platform account
- Access to your Supabase dashboard

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in app name: "Second Tail Foster Portal"
   - Add your email as support email
   - Add authorized domains (your production domain)
   - Save and continue through the scopes and test users screens

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Second Tail - Supabase Auth"
   - Add Authorized JavaScript origins:
     - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co`
   - Add Authorized redirect URIs:
     - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
   
7. Click **Create** and copy your **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Open your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and toggle it to **Enabled**
4. Paste your Google **Client ID** and **Client Secret**
5. Click **Save**

## Step 3: Update Environment Variables (Optional)

The app already uses these environment variables which are configured in your v0 project:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Redirect URL for development (already set)

No additional environment variables are needed for Google OAuth!

## Step 4: Configure Database Trigger for New Users

When users sign up (either via email or Google), we need to create their profile automatically. Run this SQL script in your Supabase SQL Editor or via the v0 scripts system:

\`\`\`sql
-- Create function to handle new user signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    name,
    email,
    role,
    org_role,
    created_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'foster'),
    coalesce(new.raw_user_meta_data ->> 'org_role', null),
    now()
  );

  -- If signing up as rescue org admin, create the organization
  if (new.raw_user_meta_data ->> 'org_name') is not null then
    insert into public.organizations (
      name,
      email,
      phone,
      created_at
    )
    values (
      new.raw_user_meta_data ->> 'org_name',
      new.email,
      coalesce(new.raw_user_meta_data ->> 'phone', null),
      now()
    )
    returning id into new.raw_user_meta_data;
    
    -- Update profile with organization_id
    update public.profiles
    set organization_id = (
      select id from public.organizations 
      where email = new.email 
      order by created_at desc 
      limit 1
    )
    where id = new.id;
  end if;

  return new;
end;
$$;

-- Create trigger to automatically call the function when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
\`\`\`

## Step 5: Test the Integration

1. Navigate to `/sign-up/foster` or `/sign-up/rescue` in your app
2. Click "Continue with Google"
3. Select your Google account
4. Grant permissions
5. You should be redirected back to the app and logged in
6. Check the `profiles` table in Supabase to verify your profile was created

## Troubleshooting

### Google OAuth Button Does Nothing
- Check browser console for errors
- Verify your Google OAuth credentials are correctly entered in Supabase
- Ensure redirect URIs match exactly (including https://)

### "Email not confirmed" Error
- Google OAuth users are automatically confirmed
- Email/password users need to click the confirmation link sent to their email

### Profile Not Created
- Check if the database trigger is installed correctly
- Verify RLS policies allow profile creation
- Check Supabase logs for errors

### Redirect Not Working
- Verify `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is set correctly in v0
- Check that the callback route exists at `/app/auth/callback/route.ts`

## Security Notes

- Never commit Google Client Secret to version control
- Always use Row Level Security (RLS) policies on your database tables
- Review and limit OAuth scopes to only what your app needs
- Consider implementing additional email verification for sensitive operations

## Additional Resources

- [Supabase Google OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Best Practices](https://nextjs.org/docs/authentication)
