# 🔐 Access Portal — Secure Admin Gallery

Production-ready **secure web application** built with **Next.js (App Router) + Tailwind CSS + Supabase (Auth + Database + Storage)**.

Dark futuristic glassmorphism UI: deep navy/black background, diagonal blue/purple gradient glows, frosted-glass cards, neon cyan→purple gradients and glowing buttons.

> ⚠️ **Admin-only system.** There is **no signup page, no signup link, and zero `signUp()` calls anywhere in the codebase**. The first (and only) admin user is created manually in the Supabase dashboard, and public registration is disabled in Auth settings.

---

## Features

| Feature | Implementation |
|---|---|
| **Login (`/login`)** | "ACCESS PORTAL" / "LOGIN TO YOUR SECURE ACCOUNT", glowing avatar badge overlapping a glass card, username field (person icon), password field (lock icon), neon **SIGN IN** button, **only** a "Forgot Password?" link |
| **Auth** | `supabase.auth.signInWithPassword()`; `/admin/*` protected by middleware **and** server-component re-check; logout via `/auth/signout` |
| **Admin Dashboard (`/admin`)** | Change-password form (`supabase.auth.updateUser()`), gallery management, LOG OUT button |
| **Secure Gallery** | Uploads go to a **private** Supabase Storage bucket; images are shown **only to logged-in users** via short-lived **signed URLs** (10 min); admin can delete images; direct public URLs return 400/403 |
| **Security** | RLS on all tables, authenticated-only SELECT, owner-only INSERT/DELETE, private bucket + storage RLS policies, secrets via env vars only, file type/size validation, path-traversal guards |

---

## Project structure

```
secure-app/
├── app/
│   ├── layout.tsx                  # Root layout + glow background layers
│   ├── globals.css                 # Glassmorphism / neon theme utilities
│   ├── page.tsx                    # / → redirect to /login
│   ├── login/page.tsx              # ACCESS PORTAL login page
│   ├── admin/page.tsx              # Protected dashboard (server component)
│   ├── auth/
│   │   ├── signout/route.ts        # Logout handler
│   │   ├── callback/route.ts       # Password-recovery code exchange
│   │   └── reset-request/page.tsx  # "Forgot Password?" flow (no signup!)
│   └── api/gallery/
│       ├── upload/route.ts         # Session-verified upload → private bucket
│       └── delete/route.ts         # Owner-only delete (storage + metadata)
├── components/
│   ├── LoginForm.tsx               # Neon login form (signInWithPassword)
│   ├── ChangePasswordForm.tsx      # updateUser({ password })
│   ├── GalleryManager.tsx          # Grid + upload + delete (signed URLs)
│   ├── LogoutButton.tsx
│   └── icons.tsx                   # Person / lock / avatar SVGs
├── lib/supabase/
│   ├── client.ts                   # Browser client (anon key only)
│   ├── server.ts                   # Cookie-bound server client (anon key)
│   └── middleware.ts               # Session refresh + route protection
├── middleware.ts                   # Guards /admin, redirects logged-in users off /login
├── supabase/schema.sql             # Tables + RLS + private bucket setup
├── sql/schema.sql                  # (same script, alternate location)
└── .env.example                    # Environment template
```

---

## 1 · Supabase setup guide (step by step)

### Step 1 — Create the project
1. Go to <https://supabase.com> → **New project**.
2. Choose a name, a strong database password, and the region closest to you. Wait for provisioning.

### Step 2 — Run the SQL script
1. Dashboard → **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates:
   - `public.gallery_items` table with **RLS enabled**
   - Policies: authenticated `SELECT`; owner-only `INSERT` / `DELETE`; no `UPDATE`
   - The **private** `gallery` storage bucket (8 MB limit, image MIME types only)
   - Storage RLS policies scoped to each admin's own `<uid>/` folder

### Step 3 — Create the FIRST ADMIN USER manually (the only way)
1. Dashboard → **Authentication** → **Users** → **Add user**.
2. Enter the admin **email** and a strong **password** (≥ 10 characters recommended).
3. ✅ Tick **“Auto Confirm User”** → **Create**.

### Step 4 — Lock down registration (make signup impossible)
1. Dashboard → **Authentication** → **Sign In / Up** (Provider settings).
2. Under **Email** provider, turn **OFF** “Allow new users to sign up”.
3. *(Optional hardening)* **Authentication** → **URL Configuration**: add your site URL(s) and set **Site URL**; add `http://localhost:3000/auth/callback` to **Redirect URLs** for local dev.

### Step 5 — Get your keys
Dashboard → **Settings → API** (or **Connect / API Keys**):
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> The `service_role` key is **not needed** by this app. If you ever use it, keep it server-side only — never prefix it with `NEXT_PUBLIC_`.

---

## 2 · Run locally

```bash
cd secure-app
npm install
cp .env.example .env.local     # then fill in your URL + anon key
npm run dev
```

Open <http://localhost:3000> → you'll be redirected to **/login**. Sign in with the admin email/password from Step 3 → you land on **/admin**.

---

## 3 · Deploy to Vercel

### Option A — Vercel CLI
```bash
npm i -g vercel
cd secure-app
vercel            # preview: vercel link + build
vercel --prod     # production deploy
```

### Option B — GitHub import
1. Push this folder to a GitHub repo.
2. vercel.com → **Add New → Project** → import the repo.
3. Framework is auto-detected (**Next.js**). Keep default build settings.

### Set environment variables (required)
In Vercel: **Project → Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |

Redeploy after adding them.

### Final production steps in Supabase
1. **Authentication → URL Configuration**: Site URL = your Vercel domain; add `https://your-app.vercel.app/auth/callback` to Redirect URLs.
2. Verify the `gallery` bucket shows **Private** in Storage.
3. Test: open an incognito window and hit `https://YOUR-REF.supabase.co/storage/v1/object/public/gallery/<any-path>` — it must be **denied** (private bucket). Images should only render inside `/admin` via signed URLs.

---

## Security model summary

- **Route protection:** `middleware.ts` + server-side `getUser()` check on `/admin` (defense in depth). Unauthenticated requests are redirected to `/login`.
- **Database:** RLS on `gallery_items` — `SELECT` for authenticated sessions only; `INSERT`/`DELETE` restricted to `(select auth.uid()) = user_id`; no update policy exists.
- **Storage:** `gallery` bucket created with `public = false` → objects are unreachable by direct URL. All reads happen through **signed URLs generated server-side** (10-minute expiry). Upload/delete policies restrict each admin to their own `{uid}/` folder, with extra path-traversal checks in the API routes.
- **Upload validation:** MIME allow-list (`png/jpeg/webp/gif`) + 8 MB size cap enforced both client-side and in the server route handler (bucket-level limits also apply).
- **Secrets:** only `NEXT_PUBLIC_*` values reach the browser; nothing sensitive is hardcoded. `.env*` files are gitignored.
- **No registration:** zero `signUp()` calls in the codebase; public sign-up disabled in Supabase Auth settings; the only account-creation path is the dashboard “Add user” action.
