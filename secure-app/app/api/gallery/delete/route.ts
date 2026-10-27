import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Deletes a gallery image (storage object + metadata row).
// RLS ensures only the owning admin can delete.
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string; file_path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, file_path: filePath } = body;
  if (!id || !filePath || typeof id !== 'string' || typeof filePath !== 'string') {
    return NextResponse.json({ error: 'Missing id or file_path' }, { status: 400 });
  }

  // Path traversal guard: file must live under the caller's own uid folder.
  if (!filePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
  }

  const { error: dbError } = await supabase
    .from('gallery_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const { error: storageError } = await supabase.storage
    .from('gallery')
    .remove([filePath]);

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
