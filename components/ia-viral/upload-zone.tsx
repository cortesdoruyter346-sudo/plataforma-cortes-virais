'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, ImageIcon, VideoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  label: string;
  accept?: 'image' | 'video' | 'both';
  onFileSelected: (file: File, previewUrl: string) => void;
  onClear?: () => void;
  className?: string;
}

export function UploadZone({
  label,
  accept = 'both',
  onFileSelected,
  onClear,
  className,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const acceptStr =
    accept === 'image'
      ? 'image/*'
      : accept === 'video'
        ? 'video/*'
        : 'image/*,video/*';

  const handleFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setFileName(file.name);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      onFileSelected(file, url);
    },
    [onFileSelected]
  );

  const handleClear = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    setMediaType(null);
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  }, [preview, onClear]);

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={acceptStr}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={cn(
            'group relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center transition-all duration-300 hover:border-[#00FF88]/50 hover:bg-zinc-900/80',
            isDragging && 'border-[#00FF88] bg-[#00FF88]/5 neon-glow-sm'
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-all duration-300 group-hover:bg-[#00FF88]/10 group-hover:text-[#00FF88]">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">{label}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Clique ou arraste o arquivo aqui
            </p>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
            {accept !== 'image' && (
              <span className="flex items-center gap-1">
                <VideoIcon className="h-3 w-3" /> MP4
              </span>
            )}
            {accept !== 'video' && (
              <span className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> JPG, PNG
              </span>
            )}
          </div>
        </button>
      ) : (
        <div className="group relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
          {mediaType === 'video' ? (
            <video
              src={preview}
              className="h-48 w-full object-contain"
              controls
              muted
              loop
            />
          ) : (
            <img
              src={preview}
              alt={fileName || 'Preview'}
              className="h-48 w-full object-contain"
            />
          )}
          <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/80 px-3 py-2">
            <span className="truncate text-xs text-zinc-400">
              {fileName}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
            >
              <X className="h-3 w-3" /> Remover
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
