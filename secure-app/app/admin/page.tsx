import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import GalleryManager from '@/components/GalleryManager';

export const metadata = { title: 'Admin Dashboard — Access Portal' };

// Server Component: re-checks auth on every request (defense in depth —
// middleware already guards /admin, but we verify again here).
export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // List gallery metadata (RLS: only authenticated users can SELECT).
  const { data: items, error: listError } = await supabase
    .from('gallery_items')
    .select('id, file_path, created_at')
    .order('created_at', { ascending: false });

  // Generate SHORT-LIVED signed URLs server-side. The private bucket
  // objects are never publicly accessible by direct URL.
  let images: { id: string; file_path: string; createdAt: string; url: string }[] = [];
  if (!listError && items && items.length > 0) {
    const { data: signed, error: signError } = await supabase.storage
      .from('gallery')
      .createSignedUrls(items.map((i) => i.file_path), 60 * 10); // 10 minutes

    if (!signError && signed) {
      images = items.map((item, idx) => ({
        id: item.id,
        file_path: item.file_path,
        createdAt: item.created_at,
        url: signed[idx]?.signedUrl ?? '',
      }));
    }
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-[32px] tracking-[4px] font-extrabold text-[#e9edf3]">
              ADMIN DASHBOARD
            </h1>
            <p className="text-[#c7ccd6] tracking-[2px] mt-1 text-[14px]">
              SIGNED IN AS {user.email}
            </p>
          </div>
          <LogoutButton />
        </header>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* Change password */}
          <section className="glass-card p-8">
            <h2 className="text-xl tracking-[3px] font-bold mb-6 text-[#e9edf3]">
              CHANGE PASSWORD
            </h2>
            <ChangePasswordForm />
          </section>

          {/* Secure gallery */}
          <section className="glass-card p-8">
            <h2 className="text-xl tracking-[3px] font-bold mb-6 text-[#e9edf3]">
              SECURE GALLERY
            </h2>
            <GalleryManager initialImages={images} />
          </section>
        </div>
      </div>
    </main>
  );
}
