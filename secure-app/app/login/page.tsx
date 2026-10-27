import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginForm from '@/components/LoginForm';

// Admin-only system: there is intentionally NO signup page or link anywhere.
export default async function LoginPage() {
  // If Supabase env vars aren't configured yet, still render the login UI
  // (preview mode); actual sign-in will report a configuration error.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) redirect('/admin');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <h1 className="text-[44px] tracking-[5px] font-extrabold text-center text-[#e9edf3]">
        ACCESS PORTAL
      </h1>
      <p className="text-[#c7ccd6] tracking-[3px] mt-2.5 mb-10 text-center text-[15px]">
        LOGIN TO YOUR SECURE ACCOUNT
      </p>

      {/* Glowing avatar badge overlapping the top edge of the card */}
      <LoginForm />

      {/* No "Create an Account" link on purpose — registration is disabled. */}
    </main>
  );
}
