-- ============================================================
-- ACCESS PORTAL — Supabase setup script
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) GALLERY METADATA TABLE
-- ------------------------------------------------------------
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_path text not null unique,
  original_name text,
  created_at timestamptz not null default now()
);

alter table public.gallery_items enable row level security;

-- Authenticated users may view gallery metadata.
create policy "gallery_select_authenticated"
  on public.gallery_items
  for select
  to authenticated
  using (true);

-- Only the owning admin may insert their own rows.
create policy "gallery_insert_own"
  on public.gallery_items
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Only the owning admin may delete their own rows.
create policy "gallery_delete_own"
  on public.gallery_items
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- No UPDATE is permitted at all (no update policy exists).
-- Anonymous users get nothing: RLS denies by default.

-- ------------------------------------------------------------
-- 2) PRIVATE STORAGE BUCKET ("gallery")
--    public => false  ⇒ objects are NOT publicly accessible by
--    direct URL; access requires signed URLs or RLS policies.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  false,                              -- PRIVATE bucket
  8388608,                            -- 8 MB max file size
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update
set public = false,
    file_size_limit = 8388608,
    allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

-- Storage RLS policies on storage.objects -------------------

-- Admins (authenticated) can read any gallery object
-- (used when generating signed URLs / serving to logged-in users).
create policy "gallery_storage_select_authenticated"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'gallery');

-- Admins can upload ONLY into their own uid folder.
create policy "gallery_storage_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'gallery'
    AND (select auth.uid())::text = (str_to_array(name, '/'))[1]
  );

-- Admins can update (overwrite) only their own folder.
create policy "gallery_storage_update_own_folder"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'gallery'
    AND (select auth.uid())::text = (str_to_array(name, '/'))[1]
  )
  with check (
    bucket_id = 'gallery'
    AND (select auth.uid())::text = (str_to_array(name, '/'))[1]
  );

-- Admins can delete only their own folder.
create policy "gallery_storage_delete_own_folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'gallery'
    AND (select auth.uid())::text = (str_to_array(name, '/'))[1]
  );

-- There is intentionally NO anon policy: unauthenticated requests
-- to the bucket are denied, and the bucket is not public.

-- ------------------------------------------------------------
-- 3) CREATE THE FIRST ADMIN USER
-- ------------------------------------------------------------
-- DO NOT create users via SQL/signUp. Create the admin manually:
--   Supabase Dashboard → Authentication → Users → "Add user"
--   → Enter email + password → tick "Auto Confirm User" → Create.
-- That account is your only admin. Registration stays impossible
-- because "Allow new users to sign up" is disabled in Auth settings.
