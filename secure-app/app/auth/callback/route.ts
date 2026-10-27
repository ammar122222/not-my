import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Handles the Supabase password-recovery code link, then sends the
// admin to /admin to set a new password. Never used for signup.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/admin';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Invalid+or+expired+link`);
}
