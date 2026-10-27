'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export type GalleryImage = {
  id: string;
  file_path: string;
  createdAt: string;
  url: string;
};

const MAX_FILE_MB = 8;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export default function GalleryManager({
  initialImages,
}: {
  initialImages: GalleryImage[];
}) {
  const router = useRouter();
  const [images] = useState<GalleryImage[]>(initialImages);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, startDeleteTransition] = useTransition();

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError('Choose an image first.');
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PNG, JPEG, WEBP or GIF images are allowed.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Max file size is ${MAX_FILE_MB} MB.`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    // Upload goes through a server route handler that verifies the session.
    const res = await fetch('/api/gallery/upload', {
      method: 'POST',
      body: formData,
    });
    setUploading(false);

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json?.error) {
      setError(json?.error ?? 'Upload failed.');
      return;
    }

    setSuccess('Image uploaded.');
    setFile(null);
    // Reset the input element value
    const input = document.getElementById('gallery-file') as HTMLInputElement | null;
    if (input) input.value = '';
    router.refresh(); // Re-run the server component → fresh signed URLs
  }

  function handleDelete(id: string, filePath: string) {
    if (!confirm('Delete this image permanently?')) return;
    startDeleteTransition(async () => {
      const res = await fetch('/api/gallery/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, file_path: filePath }),
      });
      if (res.ok) {
        setError(null);
        setSuccess('Image deleted.');
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ?? 'Delete failed.');
      }
    });
  }

  return (
    <div>
      {/* Upload form */}
      <form onSubmit={handleUpload} className="mb-8">
        <label htmlFor="gallery-file" className="field-label">
          UPLOAD IMAGE (PRIVATE BUCKET)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="gallery-file"
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="neon-input !pl-4 file:mr-3 file:bg-[rgba(20,22,30,.8)] file:text-[#9aa3b2] file:border-0 file:rounded-md file:px-3 file:py-1"
          />
          <button
            type="submit"
            className="neon-btn shrink-0 !text-sm !tracking-[3px]"
            disabled={uploading}
          >
            {uploading ? 'UPLOADING…' : 'UPLOAD'}
          </button>
        </div>
      </form>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {success && <p className="text-emerald-300 text-sm mb-4">{success}</p>}

      {/* Gallery grid — signed URLs only, valid for a short time */}
      {images.length === 0 ? (
        <p className="text-[#8b93a3] text-center py-10 tracking-widest">
          NO IMAGES YET
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <figure
              key={img.id}
              className="glass-card overflow-hidden group relative"
            >
              {img.url ? (
                <Image
                  src={img.url}
                  alt={img.file_path.split('/').pop() ?? 'gallery image'}
                  width={480}
                  height={320}
                  unoptimized // signed URLs expire; skip Next image optimization cache
                  className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-40 bg-[rgba(20,22,30,.6)] flex items-center justify-center text-[#8b93a3] text-xs">
                  LINK EXPIRED — REFRESH
                </div>
              )}
              <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-[11px] text-[#8b93a3] truncate">
                  {img.file_path.split('/').pop()}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id, img.file_path)}
                  className="text-[11px] font-bold tracking-widest text-[#ff8aa0] hover:text-white border border-[rgba(255,92,122,.5)] rounded-md px-2 py-1 transition-colors"
                >
                  DELETE
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
