'use client';

import { useState } from 'react';
import { Smile, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadZone } from './upload-zone';
import { VideoResultCard } from './video-result-card';
import { CreditBadge, type CreditInfo, type ActionType } from './credit-badge';
import { toast } from 'sonner';

interface TrocaRostoTabProps {
  onAction: ActionType;
  creditInfo: CreditInfo;
}

export function TrocaRostoTab({ onAction, creditInfo }: TrocaRostoTabProps) {
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [basePreview, setBasePreview] = useState<string | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSwap = async () => {
    if (!baseFile || !faceFile) {
      toast.error('Faça upload do vídeo base e da foto do rosto');
      return;
    }

    const allowed = await onAction('Trocar Rosto');
    if (!allowed) return;

    setIsLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const res = await fetch('/api/face-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseVideoUrl: basePreview,
          faceImageUrl: facePreview,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao trocar rosto');

      setResultUrl(data.videoUrl);
      toast.success('Rosto trocado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00FF88]/10 text-[#00FF88]">
            <Smile className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Troca de Rosto</h2>
            <p className="text-xs text-zinc-500">Faça face swap em vídeos com IA</p>
          </div>
          <CreditBadge info={creditInfo} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Vídeo base
            </label>
            <UploadZone
              label="Vídeo base"
              accept="video"
              onFileSelected={(file, preview) => {
                setBaseFile(file);
                setBasePreview(preview);
              }}
              onClear={() => {
                setBaseFile(null);
                setBasePreview(null);
              }}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Foto do rosto
            </label>
            <UploadZone
              label="Foto do rosto"
              accept="image"
              onFileSelected={(file, preview) => {
                setFaceFile(file);
                setFacePreview(preview);
              }}
              onClear={() => {
                setFaceFile(null);
                setFacePreview(null);
              }}
            />
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSwap}
            disabled={isLoading || !baseFile || !faceFile}
            className="w-full bg-[#00FF88] text-black font-semibold hover:bg-[#00FF88]/90 disabled:opacity-40 sm:w-auto sm:px-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Trocando rosto...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Trocar rosto (100 créditos | R$1)
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-sm">
        <VideoResultCard
          videoUrl={resultUrl}
          isLoading={isLoading}
          error={error}
          title="Resultado do face swap"
          aspectRatio="16:9"
        />
      </div>
    </div>
  );
}
