# Outlet Performance Dashboard

A Vite + vanilla JS dashboard backed by Supabase (`outlet_weekly` table).

## Local development

```bash
npm install
npm run dev
```

This reads Supabase credentials from `.env` (already filled in with your
project's URL and anon/publishable key — safe to expose client-side since
the table is RLS-protected for read-only access).

If you don't have `.env` yet, copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel, "Add New Project" → import the repo. Vercel auto-detects Vite
   (build command `vite build`, output directory `dist`).
3. Before the first deploy, add these two Environment Variables in the
   Vercel project settings (Settings → Environment Variables), for all
   environments (Production, Preview, Development):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Use the same values from your local `.env` file. (`.env` itself is
   gitignored and never gets pushed — Vercel needs its own copy of these.)
4. Deploy. Vercel will run `npm install && npm run build` and serve `dist/`.

Alternatively, via the Vercel CLI:

```bash
npm i -g vercel
vercel          # first deploy, follow prompts
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

## Project structure

```
index.html              Page shell (no inline script/style)
src/main.js              App logic — rendering, filtering, loadData()
src/supabaseClient.js    Supabase client, reads from import.meta.env
src/style.css            All styles
.env.example              Template for required env vars
```

To point this at a different data source later, only `loadData()` in
`src/main.js` needs to change — it returns the same row shape
(`{outlet, week, sales, target, orders, returns}`) regardless of source.
