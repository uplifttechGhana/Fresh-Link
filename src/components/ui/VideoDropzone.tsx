import React, { useRef, useState } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useUploadFile } from '../../lib/hooks/useStorage';
import { resolveMediaUrl } from '../../lib/mediaUrl';

const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

interface VideoDropzoneProps {
  /** Uploaded video URL, or null if none has been added. */
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
}

/** Optional video upload with drag-and-drop (web) and tap-to-choose (native/web) fallback. */
export function VideoDropzone({ value, onChange, folder = 'produce' }: VideoDropzoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadFile = useUploadFile(folder);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('video/')) {
      setError('Please choose a video file.');
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError('Video is too large — please keep it under 30MB.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile.mutateAsync(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void handleFile(file);
  };

  return (
    <div>
      <h3 className="font-bold text-ink mb-3">
        Product Video <span className="font-normal text-muted">(optional)</span>
      </h3>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleSelect} />

      {value ? (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <video src={resolveMediaUrl(value)} controls className="w-full max-h-56 bg-black" />
          <button
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-ink"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`w-full h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
            dragActive
              ? 'border-green bg-green-50 text-green'
              : 'border-gray-300 bg-white text-muted hover:border-green hover:text-green'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="animate-spin" />
              <span className="text-xs font-bold">Uploading video…</span>
            </>
          ) : (
            <>
              <UploadCloud size={22} />
              <span className="text-xs font-bold">Drag a video here, or tap to choose</span>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
