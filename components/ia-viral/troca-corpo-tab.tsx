'use client';

import { useState } from 'react';
import { Shirt, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadZone } from './upload-zone';
import { VideoResultCard } from './video-result-card';
import { CreditBadge, type CreditInfo, type ActionType } from './credit-badge';
import { toast } from 'sonner';

interface TrocaCorpoTabProps {
  onAction: ActionType;
  creditInfo: CreditInfo;
}

export function TrocaCorpoTab({ onAction, creditInfo }: TrocaCorpoTabProps) {
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSwap = async () => {
    if (!personFile || !garmentFile) {
      toast.error('Faça upload do vídeo e da foto da roupa');
      return;
    }

    const allowed = await onAction('Trocar Corpo');
    if (!allowed) return;

    setIsLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const res = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personVideoUrl: personPreview,
          garmentImageUrl: garmentPreview,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao trocar roupa');

      setResultUrl(data.videoUrl);
      toast.success('Roupa trocada com sucesso!');
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
            <Shirt className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Troca de Corpo</h2>
            <p className="text-xs text-zinc-500">Troque a roupa de uma pessoa no vídeo usando IA</p>
          </div>
          <CreditBadge info={creditInfo} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Vídeo da pessoa
            </label>
            <UploadZone
              label="Vídeo da pessoa"
              accept="video"
              onFileSelected={(file, preview) => {
                setPersonFile(file);
                setPersonPreview(preview);
              }}
              onClear={() => {
                setPersonFile(null);
                setPersonPreview(null);
              }}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Foto da roupa
            </label>
            <UploadZone
              label="Foto da roupa"
              accept="image"
              onFileSelected={(file, preview) => {
                setGarmentFile(file);
                setGarmentPreview(preview);
              }}
              onClear={() => {
                setGarmentFile(null);
                setGarmentPreview(null);
              }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="hidden items-center gap-3 text-zinc-600 sm:flex">
            <div className="h-px w-12 bg-zinc-800" />
            <ArrowRight className="h-4 w-4" />
            <div className="h-px w-12 bg-zinc-800" />
          </div>
          <Button
            onClick={handleSwap}
            disabled={isLoading || !personFile || !garmentFile}
            className="w-full bg-[#00FF88] text-black font-semibold hover:bg-[#00FF88]/90 disabled:opacity-40 sm:w-auto sm:px-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Trocando roupa...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Trocar roupa (100 créditos | R$1)
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
          title="Resultado da troca de roupa"
          aspectRatio="9:16"
        />
      </div>
    </div>
  );
}
