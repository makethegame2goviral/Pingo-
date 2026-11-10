# PINGO

A responsive private-chat web app built with Supabase.

## Features
- Username + password registration and login (no email field).
- Private one-to-one conversations with username search.
- Persistent messages and live updates through Supabase Realtime.
- Responsive desktop, tablet, iPad portrait/landscape and phone layouts.
- On phones, chat view switches to a full-screen conversation with a back button.
- PWA manifest, app icon and offline-cached app shell.
- Accessible labels, keyboard message sending, safe-area and reduced-motion support.

## Backend
- Supabase project: Size
- Edge Function: `pingo-auth`
- Tables: `pingo_usernames`, `pingo_conversations`, `pingo_conversation_members`, `pingo_messages`.
- Realtime publication: `pingo_messages`.
- Conversation membership and message access are restricted with RLS.

The frontend contains only the publishable key. The service-role key stays inside Supabase Edge Function secrets and is never committed here.

## Account rules
- Username: 3–20 characters, letters, numbers and underscore.
- Password: 8–72 characters.
- Usernames are unique without case sensitivity.
- No email-based password reset is configured yet.

## Install
Deploy the repository root over HTTPS (for example with GitHub Pages). On iPhone/iPad, open the deployed site in Safari, tap Share, then “Add to Home Screen”. On supported browsers, use the browser's install option.

The offline cache keeps the app shell available. Authentication, searching and sending messages still require an internet connection.

## Security notes
- Never add a Supabase service-role or secret key to frontend files.
- The public auth Edge Function validates input; rate limiting / abuse protection should be added before opening registration widely.
- Chat tables use RLS; users can only read conversations they belong to and send messages as themselves.
- The membership helper is in the non-exposed `private` schema. The public chat RPC functions derive identity from `auth.uid()`.
