'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LockIcon } from '@/components/icons';

// Password recovery for the existing admin account only.
// This NEVER creates accounts — it uses resetPasswordForEmail, not signUp.
export default function ResetRequestPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/auth/callback?next=/admin` }
    );
    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('sent');
      setMessage('If the account exists, a reset link has been sent.');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <h1 className="text-[32px] tracking-[4px] font-extrabold text-center text-[#e9edf3]">
        PASSWORD RECOVERY
      </h1>
      <p className="text-[#c7ccd6] tracking-[3px] mt-2.5 mb-10 text-center text-[14px]">
        ADMIN ACCOUNT RESET ONLY
      </p>

      <div className="flex flex-col items-center">
        <div className="avatar-badge">
          <LockIcon size={64} />
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="glass-card w-[min(430px,92vw)] px-[42px] pt-[100px] pb-[42px]"
        >
          <label htmlFor="email" className="field-label">
            EMAIL
          </label>
          <div className="relative mb-6">
            <span className="input-icon">
              <LockIcon />
            </span>
            <input
              id="email"
              type="email"
              className="neon-input"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {status !== 'idle' && (
            <p
              className={`text-sm mb-4 text-center tracking-wide ${
                status === 'error' ? 'text-red-400' : 'text-emerald-300'
              }`}
            >
              {message}
            </p>
          )}

          <button type="submit" className="neon-btn w-full mt-1.5">
            SEND RESET LINK
          </button>

          <div className="mt-6 text-center">
            <a href="/login" className="text-[#dfe3ea] text-sm hover:text-[#7ee0ff]">
              ← Back to SIGN IN
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
