# MHINA FOREX

Forex education, market analysis, trading signals, AI chart/news analysis,
community and live-session platform — single-repo monorepo (React client +
Express API, Supabase as the backing database).

## Project structure

```
mhina-forex/
├── client/          React (Vite) — auth, dashboard, education, signals,
│                    market/news, AI analyzer, community, live sessions,
│                    admin Headway queue
├── server/          Express API — every domain route, tier gating,
│                    AzamPay checkout + webhook, media upload signing,
│                    Daily.co room/token minting, AI chart analysis
├── db/              Supabase SQL: schema, RLS policies, triggers
└── package.json     Root workspace — runs client + server together
```

## One-time setup

1. Create a Supabase project, then run the SQL files in `db/` **in order**
   in the Supabase SQL editor:
   - `db/01_schema.sql`
   - `db/02_rls_policies.sql`
   - `db/03_triggers.sql` (auto-creates a `profiles` row on signup)

2. Copy environment files and fill in real values:
   ```
   cp server/.env.example server/.env
   cp client/.env.example client/.env.local
   ```
   Needed: Supabase URL/anon key/service role key, AzamPay sandbox
   credentials + vendor ID, Cloudflare Images account ID + token, Bunny
   Stream library ID + API key, a Daily.co API key, and an Anthropic API
   key (for the AI Chart Analyzer — swap `server/src/config/aiProvider.js`
   if you choose a different AI provider).

3. Install everything from the root:
   ```
   npm install
   ```

## Running the whole project

```
npm run dev
```

Starts **both** the Express API (`localhost:4000`) and the React app
(`localhost:5173`) together with labeled, colored log output.

## What's implemented

- ✅ Full DB schema + RLS policies + signup trigger
- ✅ Auth (login/register) wired to Supabase, with the access-gate flow
  (Headway submission form + AzamPay checkout buttons)
- ✅ Tier-gating middleware on the API, mirroring the RLS policies
- ✅ Signals, Education (courses/lessons/enroll), Market Analysis, News
- ✅ AI Chart Analyzer (calls an AI provider, stores structured results,
  can never force a BUY/SELL — returns "no clear setup" when unclear)
- ✅ Community (posts, likes, comments, reports, moderation queue)
- ✅ Live Sessions — Daily.co room creation + per-user join-token minting,
  role-gated (host vs viewer) based on mentorship vs broadcast type
- ✅ Notifications table + helper for other routes to push into it
- ✅ Media upload flow: direct-to-Cloudflare-Images and direct-to-Bunny
  uploads (files never pass through our server)
- ✅ Admin: Headway verification queue (approve/reject)

## Known gaps to fix while debugging (marked with TODO in code)

- **`server/src/config/bunnyStream.js`** — `signPlaybackUrl()` has a
  placeholder token; needs the real SHA256 signing implementation once
  you enable Token Authentication on your Bunny library and have its
  signing key.
- **`server/src/config/azampay.js`** — checkout payload field names/URLs
  should be double-checked against AzamPay's current API docs before
  going live; currency is hardcoded to USD as a placeholder — decide
  whether membership pricing charges in TZS or USD.
- **AzamPay webhook signature verification** (`server/src/routes/payments.js`)
  isn't implemented yet — currently trusts the payload as-is, which is
  NOT safe for production.
- **`profiles_select_public_basic` RLS policy** currently exposes the
  whole `profiles` row (including email/phone) to any authenticated
  user — needs a public-facing view that excludes sensitive columns.
- **No file-picker UI yet** for chart/video uploads — the AI Analyzer and
  media routes exist and work, but the frontend needs an actual
  upload-and-track-progress component wired to them.
- **No Daily embedded call UI** — `LiveSessions.jsx` gets a join token
  but doesn't render the actual video call frame yet.
- **Admin panel is minimal** — only the Headway queue has a page; course
  creation, signal publishing, and the community moderation queue all
  have working API routes but no admin UI yet.
