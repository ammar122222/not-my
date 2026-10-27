'use client';

import { createBrowserClient } from '@supabase/ssr';

// Public anon client — safe for the browser. RLS enforces all authorization.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured yet, return null so UI can still render
  // in preview mode; actions will show a configuration error instead of crashing.
  if (!url || !anonKey) return null;

  return createBrowserClient(url, anonKey);
}
