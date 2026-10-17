'use client';

import { Download, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoResultCardProps {
  videoUrl: string | null;
  isLoading: boolean;
  error: string | null;
  title?: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

export function VideoResultCard({
  videoUrl,
  isLoading,
  error,
  title = 'Resultado',
  aspectRatio = '9:16',
}: VideoResultCardProps) {
  const aspectClass =
    aspectRatio === '9:16'
      ? 'aspect-[9/16]'
      : aspectRatio === '16:9'
        ? 'aspect-[16/9]'
        : 'aspect-square';

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950',
          aspectClass
        )}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="absolute inset-0 shimmer" />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-[#00FF88]" />
              <p className="text-sm font-medium text-[#00FF88] neon-text">
                Gerando com IA...
              </p>
              <p className="text-xs text-zinc-500">Isso pode levar alguns minutos</p>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && videoUrl && (
          <video
            src={videoUrl}
            className="h-full w-full object-contain"
            controls
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        {!isLoading && !error && !videoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
              <Download className="h-7 w-7 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-600">O resultado aparecerá aqui</p>
          </div>
        )}
      </div>

      {!isLoading && !error && videoUrl && (
        <a
          href={videoUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#00FF88]/30 bg-[#00FF88]/10 px-4 py-2.5 text-sm font-medium text-[#00FF88] transition-all duration-300 hover:bg-[#00FF88]/20 hover:neon-glow-sm"
        >
          <Download className="h-4 w-4" />
          Baixar vídeo
        </a>
      )}

      {title && !isLoading && !videoUrl && !error && (
        <p className="mt-2 text-center text-xs text-zinc-600">{title}</p>
      )}
    </div>
  );
}
