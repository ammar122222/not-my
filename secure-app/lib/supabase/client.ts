'use client';

import { createBrowserClient } from '@supabase/ssr';

// Public anon client — safe for the browser. RLS enforces all authorization.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
