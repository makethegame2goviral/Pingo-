# PINGO

Dark, social-first web app starter.

## Current status
- Username + password registration and login (no email or phone field).
- Supabase Auth handles password storage and sessions.
- A server-side Supabase Edge Function maps usernames to internal, non-deliverable auth identifiers.
- Signed-in welcome screen is ready. Chats, groups, calls and moments are not implemented yet.

## Backend
- Supabase project: Size
- Edge Function: pingo-auth
- Function URL: https://puddgzxqekteblmlpiqv.supabase.co/functions/v1/pingo-auth
- Database table: public.pingo_usernames (RLS enabled; browser roles have no table access).

The frontend contains only the publishable key. The service-role key stays inside Supabase Edge Function secrets and is never committed here.

## Account rules
- Username: 3–20 characters, letters, numbers and underscore.
- Password: 8–72 characters.
- Names are unique without case sensitivity.
- There is no email-based password reset. Account recovery needs a separate recovery-code feature.

## Run
Open index.html through a static web host such as GitHub Pages. HTTPS is required for normal browser deployment.

## Security
- Never add a Supabase service-role or secret key to frontend files.
- The auth function is public by design and validates all inputs server-side.
- Add rate limiting / abuse protection before opening registration widely.
