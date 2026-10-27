import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Logout route: clears the session server-side and returns to /login.
export async function GET(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  });
}
