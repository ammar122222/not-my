import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_MB = 8;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

// Uploads an image into the PRIVATE "gallery" bucket.
// Auth is verified server-side; RLS on gallery_items + storage policies
// enforce that only authenticated admins can write.
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('image');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 8 MB)' }, { status: 400 });
  }

  // Sanitize name; store under the admin's uid folder.
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-80);
  const ext = safeName.split('.').pop()?.toLowerCase() ?? 'png';
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: dbError } = await supabase.from('gallery_items').insert({
    user_id: user.id,
    file_path: path,
    original_name: safeName,
  });

  if (dbError) {
    // Roll back the storage object so we never orphan files.
    await supabase.storage.from('gallery').remove([path]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path });
}
