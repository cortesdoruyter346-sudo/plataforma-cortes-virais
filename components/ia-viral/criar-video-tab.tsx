'use client';

import { useState } from 'react';
import { Video, Loader2, Wand2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VideoResultCard } from './video-result-card';
import { CreditBadge, type CreditInfo, type ActionType } from './credit-badge';
import { toast } from 'sonner';

const STYLES = [
  { value: 'realista', label: 'Realista', icon: '🎬' },
  { value: 'anime', label: 'Anime', icon: '🎨' },
  { value: 'amazonia', label: 'Amazônia', icon: '🌿' },
  { value: 'urbano', label: 'Urbano', icon: '🌆' },
];

interface CriarVideoTabProps {
  onAction: ActionType;
  creditInfo: CreditInfo;
}

export function CriarVideoTab({ onAction, creditInfo }: CriarVideoTabProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realista');
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Descreva a cena que você quer criar');
      return;
    }

    const allowed = await onAction('Criar Vídeo');
    if (!allowed) return;

    setIsLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao gerar vídeo');

      setResultUrl(data.videoUrl);
      toast.success('Vídeo gerado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar';
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
            <Video className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Criar Vídeo com IA</h2>
            <p className="text-xs text-zinc-500">Descreva uma cena e gere um vídeo de 5 segundos</p>
          </div>
          <CreditBadge info={creditInfo} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Descrição da cena
            </label>
            <Textarea
              placeholder="Descreva a cena que você quer criar... Ex: Um leão correndo na savana ao pôr do sol, câmera em slow motion, partículas de poeira no ar..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:border-[#00FF88]/50 focus-visible:ring-[#00FF88]/20"
              disabled={isLoading}
            />
            <div className="mt-1 flex justify-between text-xs text-zinc-600">
              <span>Quanto mais detalhada a descrição, melhor o resultado</span>
              <span>{prompt.length}/500</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Estilo do vídeo
            </label>
            <Select value={style} onValueChange={setStyle} disabled={isLoading}>
              <SelectTrigger className="border-zinc-800 bg-zinc-900/50 text-white focus:border-[#00FF88]/50">
                <SelectValue placeholder="Escolha um estilo" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-white">
                {STYLES.map((s) => (
                  <SelectItem
                    key={s.value}
                    value={s.value}
                    className="focus:bg-[#00FF88]/10 focus:text-[#00FF88]"
                  >
                    <span className="mr-2">{s.icon}</span>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-[#00FF88] text-black font-semibold hover:bg-[#00FF88]/90 disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando vídeo 5s...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Gerar vídeo 5s (100 créditos | R$1)
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-md">
        <VideoResultCard
          videoUrl={resultUrl}
          isLoading={isLoading}
          error={error}
          title="Seu vídeo de 5 segundos aparecerá aqui"
          aspectRatio="16:9"
        />
      </div>
    </div>
  );
}
