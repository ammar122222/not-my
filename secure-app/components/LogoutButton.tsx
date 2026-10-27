'use client';

export default function LogoutButton() {
  return (
    <a href="/auth/signout" className="neon-btn danger-btn !text-sm !tracking-[3px] inline-block">
      LOG OUT
    </a>
  );
}
