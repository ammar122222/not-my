'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LockIcon } from '@/components/icons';

const MIN_PASSWORD_LENGTH = 10;

export default function ChangePasswordForm() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    setStatus('idle');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatus('error');
      setMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    // Updates the logged-in admin's password via Supabase Auth.
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('ok');
      setMessage('Password updated successfully.');
      setPassword('');
      setConfirm('');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <label htmlFor="newpass" className="field-label">
        NEW PASSWORD
      </label>
      <div className="relative mb-6">
        <span className="input-icon">
          <LockIcon />
        </span>
        <input
          id="newpass"
          type="password"
          className="neon-input"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>

      <label htmlFor="confirmpass" className="field-label">
        CONFIRM PASSWORD
      </label>
      <div className="relative mb-6">
        <span className="input-icon">
          <LockIcon />
        </span>
        <input
          id="confirmpass"
          type="password"
          className="neon-input"
          placeholder="Repeat New Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>

      {status !== 'idle' && (
        <p
          className={`text-sm mb-4 text-center ${
            status === 'error' ? 'text-red-400' : 'text-emerald-300'
          }`}
        >
          {message}
        </p>
      )}

      <button type="submit" className="neon-btn w-full" disabled={loading}>
        {loading ? 'UPDATING…' : 'UPDATE PASSWORD'}
      </button>
    </form>
  );
}
