# PINGO

Dark, social-first messenger web app.

## Current status
- Username + password registration and login (no email or phone field).
- Supabase Auth handles password storage and sessions.
- Private one-to-one chats with username search.
- Messages are stored in Supabase and update live through Realtime.
- Conversation and message access is restricted with Row Level Security.
- Groups, voice/video calls, moments/stories, media uploads and password recovery are not implemented yet.

## Backend
- Supabase project: Size
- Edge Function: `pingo-auth`
- Database tables: `pingo_usernames`, `pingo_conversations`, `pingo_conversation_members`, `pingo_messages`.
- Realtime publication: `pingo_messages`.

The frontend contains only the publishable key. The service-role key stays inside Supabase Edge Function secrets and is never committed here.

## Account rules
- Username: 3–20 characters, letters, numbers and underscore.
- Password: 8–72 characters.
- Names are unique without case sensitivity.
- There is no email-based password reset. Account recovery needs a separate recovery-code feature.

## Run
Open `index.html` through a static web host such as GitHub Pages. HTTPS is required for normal browser deployment.

## Security notes
- Never add a Supabase service-role or secret key to frontend files.
- The auth function is public by design and validates inputs server-side.
- Chat tables use RLS. Users can only read conversations they belong to and send messages as themselves.
- Direct-chat creation and chat-list functions are callable only by signed-in users and derive identity from `auth.uid()`.
- Add rate limiting / abuse protection to the public auth function before opening registration widely.
