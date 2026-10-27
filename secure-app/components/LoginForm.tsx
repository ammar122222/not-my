'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PersonIcon, LockIcon, AvatarIcon } from '@/components/icons';

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError(
        'Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
      );
      return;
    }

    setLoading(true);

    // Admin-only system: signInWithPassword ONLY. No signUp anywhere.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('Access denied');
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center">
      {/* Glowing circular avatar badge overlapping the top edge of the card */}
      <div className="avatar-badge">
        <AvatarIcon />
      </div>

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="glass-card w-[min(430px,92vw)] px-[42px] pt-[100px] pb-[42px]"
      >
        <label htmlFor="user" className="field-label">
          USERNAME
        </label>
        <div className="relative mb-6">
          <span className="input-icon">
            <PersonIcon />
          </span>
          <input
            id="user"
            type="text"
            className="neon-input"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <label htmlFor="pass" className="field-label">
          PASSWORD
        </label>
        <div className="relative mb-6">
          <span className="input-icon">
            <LockIcon />
          </span>
          <input
            id="pass"
            type="password"
            className="neon-input"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center tracking-wide">
            {error}
          </p>
        )}

        <button type="submit" className="neon-btn w-full mt-1.5" disabled={loading}>
          {loading ? 'SIGNING IN…' : 'SIGN IN'}
        </button>

        {/* Only "Forgot Password?" — NO signup link by design. */}
        <div className="mt-6 text-center">
          <a
            href="/auth/reset-request"
            className="text-[#dfe3ea] text-sm hover:text-[#7ee0ff] transition-colors"
          >
            Forgot Password?
          </a>
        </div>
      </form>
    </div>
  );
}
