'use client';

import { useState, useRef } from 'react';
import { Scissors, Link2, Download, Clock, Flame, Play, Loader2, CheckCircle2, FileVideo, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { cutVideoSegment, downloadBlob, buildFilename, parseTime, type CutProgress } from '@/lib/video-cutter';
import { CreditBadge, type CreditInfo, type ActionType } from './credit-badge';

interface Corte {
  id: number;
  title: string;
  start: string;
  end: string;
  viralScore: number;
  reason: string;
  downloadUrl?: string;
  source?: string;
  platform?: string;
}

interface CutState {
  status: 'idle' | 'cutting' | 'done' | 'error';
  progress: number;
  stage: string;
  blobUrl?: string;
  error?: string;
}

type Stage = 'idle' | 'downloading' | 'analyzing' | 'cutting' | 'done';

const STAGE_INFO: Record<Stage, { label: string; progress: number }> = {
  idle: { label: '', progress: 0 },
  downloading: { label: 'Baixando vídeo da plataforma...', progress: 25 },
  analyzing: { label: 'IA analisando conteúdo viral...', progress: 60 },
  cutting: { label: 'Cortando em 10 clipes 9:16...', progress: 90 },
  done: { label: 'Concluído!', progress: 100 },
};

const STAGE_LABELS: Record<string, string> = {
  loading: 'Baixando vídeo...',
  seeking: 'Posicionando no tempo...',
  recording: 'Cortando 9:16...',
  finalizing: 'Finalizando arquivo...',
  done: 'Pronto!',
};

const PLATFORM_BADGES: Record<string, { label: string; color: string }> = {
  youtube: { label: 'YouTube', color: 'bg-red-500/20 text-red-400' },
  tiktok: { label: 'TikTok', color: 'bg-zinc-100/10 text-zinc-100' },
  instagram: { label: 'Instagram', color: 'bg-pink-500/20 text-pink-400' },
};

function scoreColor(score: number): string {
  if (score >= 90) return 'text-[#00FF88]';
  if (score >= 80) return 'text-lime-400';
  return 'text-yellow-400';
}

function scoreBg(score: number): string {
  if (score >= 90) return 'bg-[#00FF88]/15 border-[#00FF88]/30';
  if (score >= 80) return 'bg-lime-400/10 border-lime-400/25';
  return 'bg-yellow-400/10 border-yellow-400/25';
}

interface CortesViraisTabProps {
  onAction: ActionType;
  creditInfo: CreditInfo;
}

export function CortesViraisTab({ onAction, creditInfo }: CortesViraisTabProps) {
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [cuts, setCuts] = useState<Corte[]>([]);
  const [platform, setPlatform] = useState<string>('');
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const [cutStates, setCutStates] = useState<Record<number, CutState>>({});
  const videoCacheRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValidUrl = (input: string) => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|tiktok\.com|instagram\.com)\//.test(input);
  };

  const handleGenerate = async () => {
    if (!url.trim()) {
      toast.error('Cole um link do YouTube, TikTok ou Instagram');
      return;
    }
    if (!isValidUrl(url)) {
      toast.error('Link inválido. Use YouTube, TikTok ou Instagram');
      return;
    }

    setCuts([]);
    setCutStates({});
    videoCacheRef.current = null;
    setStage('downloading');

    timerRef.current = setTimeout(() => setStage('analyzing'), 2500);
    const t2 = setTimeout(() => setStage('cutting'), 5000);

    try {
      const res = await fetch('/api/cortes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao gerar cortes');

      clearTimeout(timerRef.current!);
      clearTimeout(t2);
      setStage('done');

      setCuts(data.cortes || []);
      setPlatform(data.platform || '');
      videoCacheRef.current = data.downloadUrl || null;

      if (data.downloadUrl) {
        toast.success('10 cortes gerados! Clique em Baixar para cortar e salvar cada clipe.');
      } else {
        toast.info('10 cortes gerados! O download do vídeo original falhou, mas os pontos de corte estão prontos.');
      }

      setTimeout(() => setStage('idle'), 1500);
    } catch (err: unknown) {
      clearTimeout(timerRef.current!);
      clearTimeout(t2);
      setStage('idle');
      const msg = err instanceof Error ? err.message : 'Erro ao gerar cortes';
      toast.error(msg);
    }
  };

  const updateCutState = useCallbackRef((cutId: number, patch: Partial<CutState>) => {
    setCutStates((prev) => ({ ...prev, [cutId]: { ...prev[cutId], ...patch } }));
  });

  const handleDownload = async (cut: Corte) => {
    const allowed = await onAction('Baixar Corte');
    if (!allowed) return;

    if (!videoCacheRef.current) {
      toast.error('Vídeo original não disponível para corte. Tente gerar novamente.');
      return;
    }

    updateCutState(cut.id, { status: 'cutting', progress: 0, stage: 'Iniciando...', error: undefined });

    try {
      const startSec = parseTime(cut.start);
      const endSec = parseTime(cut.end);

      const blob = await cutVideoSegment({
        videoUrl: videoCacheRef.current,
        startSeconds: startSec,
        endSeconds: endSec,
        onProgress: (p: CutProgress) => {
          updateCutState(cut.id, {
            status: 'cutting',
            progress: p.progress,
            stage: STAGE_LABELS[p.stage] || p.stage,
          });
        },
      });

      const filename = buildFilename(cut.id, cut.title, cut.start, cut.end);
      downloadBlob(blob, filename);

      const blobUrl = URL.createObjectURL(blob);
      updateCutState(cut.id, { status: 'done', progress: 100, stage: 'Pronto!', blobUrl });

      toast.success(`Corte ${cut.id} baixado: ${filename}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cortar vídeo';
      updateCutState(cut.id, { status: 'error', progress: 0, stage: '', error: msg });
      toast.error(`Falha ao cortar: ${msg}`);
    }
  };

  const isLoading = stage !== 'idle' && stage !== 'done';

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00FF88]/10 text-[#00FF88]">
            <Scissors className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Cortes Virais</h2>
            <p className="text-xs text-zinc-500">Transforme vídeos longos em 10 cortes verticais 9:16 com IA</p>
          </div>
          <CreditBadge info={creditInfo} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <Input
              type="url"
              placeholder="Cole link YouTube / TikTok / Instagram aqui..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border-zinc-800 bg-zinc-900/50 pl-10 text-white placeholder:text-zinc-600 focus-visible:border-[#00FF88]/50 focus-visible:ring-[#00FF88]/20"
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-[#00FF88] text-black font-semibold hover:bg-[#00FF88]/90 disabled:opacity-50 sm:px-8 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Flame className="mr-2 h-4 w-4" />
                Gerar 10 Cortes 9:16
              </>
            )}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-600">Suporta:</span>
          {['YouTube', 'TikTok', 'Instagram'].map((p) => (
            <span key={p} className="rounded-full bg-zinc-800/50 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
              {p}
            </span>
          ))}
        </div>

        {isLoading && (
          <div className="mt-6 animate-fade-in-up space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#00FF88]">
                <Loader2 className="h-3 w-3 animate-spin" />
                {STAGE_INFO[stage].label}
              </span>
              <span className="font-mono text-zinc-400">{STAGE_INFO[stage].progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00FF88] to-lime-400 transition-all duration-1000 ease-out"
                style={{ width: `${STAGE_INFO[stage].progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {!isLoading && cuts.length > 0 && (
        <>
          {platform && PLATFORM_BADGES[platform] && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#00FF88]" />
              <span className="text-sm text-zinc-300">Vídeo analisado de</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', PLATFORM_BADGES[platform].color)}>
                {PLATFORM_BADGES[platform].label}
              </span>
              {!videoCacheRef.current && (
                <span className="ml-2 flex items-center gap-1 text-xs text-yellow-400">
                  <AlertCircle className="h-3 w-3" /> Download original falhou - cortes podem nao funcionar
                </span>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cuts.map((cut, i) => {
              const cs = cutStates[cut.id] || { status: 'idle', progress: 0, stage: '' };
              const isCutting = cs.status === 'cutting';
              const isDone = cs.status === 'done';
              const isError = cs.status === 'error';

              return (
                <div
                  key={cut.id}
                  className="group animate-scale-in overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur transition-all duration-300 hover:border-[#00FF88]/30 hover:neon-glow-sm"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="relative flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-950 sm:h-32 sm:w-20">
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `linear-gradient(135deg, hsl(${cut.id * 36} 80% 30%), hsl(${cut.id * 36 + 40} 70% 15%))`
                      }} />
                      {isDone && cs.blobUrl ? (
                        <button
                          onClick={() => setPreviewingId(previewingId === cut.id ? null : cut.id)}
                          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#00FF88]/20 text-[#00FF88] backdrop-blur transition-all hover:bg-[#00FF88]/30"
                        >
                          <Play className="h-4 w-4" fill="currentColor" />
                        </button>
                      ) : (
                        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur">
                          {isCutting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" fill="currentColor" />}
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-mono text-white">
                        {cut.start}
                      </div>
                      {isDone && (
                        <div className="absolute right-1 top-1 rounded bg-[#00FF88] p-0.5">
                          <CheckCircle2 className="h-3 w-3 text-black" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold leading-tight text-white">{cut.title}</h3>
                        <span className="shrink-0 text-xs font-bold text-zinc-600">#{cut.id}</span>
                      </div>

                      <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                        {cut.reason}
                      </p>

                      <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {cut.start} - {cut.end}
                        </span>
                      </div>

                      {/* Viral score */}
                      <div className={cn('mb-3 flex items-center gap-2 rounded-lg border px-3 py-1.5', scoreBg(cut.viralScore))}>
                        <Flame className={cn('h-3.5 w-3.5', scoreColor(cut.viralScore))} />
                        <span className="text-xs text-zinc-400">Viral Score</span>
                        <span className={cn('ml-auto text-lg font-bold', scoreColor(cut.viralScore))}>
                          {cut.viralScore}
                        </span>
                      </div>

                      {/* Per-card progress bar when cutting */}
                      {isCutting && (
                        <div className="mb-3 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="flex items-center gap-1 text-[#00FF88]">
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              {cs.stage}
                            </span>
                            <span className="font-mono text-zinc-400">{cs.progress}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#00FF88] to-lime-400 transition-all duration-300"
                              style={{ width: `${cs.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Error message */}
                      {isError && (
                        <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-400">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-2">{cs.error}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-auto flex gap-2">
                        <button
                          onClick={() => handleDownload(cut)}
                          disabled={isCutting || !videoCacheRef.current}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                            isDone
                              ? 'border-[#00FF88]/40 bg-[#00FF88]/15 text-[#00FF88] hover:bg-[#00FF88]/25'
                              : 'border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20',
                            (isCutting || !videoCacheRef.current) && 'cursor-not-allowed opacity-40'
                          )}
                        >
                          {isCutting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" /> Cortando...
                            </>
                          ) : isDone ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Baixar Novamente
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3" /> Baixar Corte
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setPreviewingId(previewingId === cut.id ? null : cut.id)}
                          disabled={!isDone}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                            isDone
                              ? 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-600 cursor-not-allowed'
                          )}
                        >
                          <Play className="h-3 w-3" /> Preview
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preview panel */}
                  {previewingId === cut.id && (
                    <div className="border-t border-zinc-800 bg-zinc-950/80 p-3 animate-fade-in-up">
                      {cs.blobUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <video
                            src={cs.blobUrl}
                            className="aspect-[9/16] max-h-[400px] rounded-lg object-contain"
                            controls
                            autoPlay
                            loop
                            playsInline
                          />
                          <span className="flex items-center gap-1 text-[10px] text-[#00FF88]">
                            <FileVideo className="h-3 w-3" /> Corte 9:16 {cut.start} - {cut.end}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                          <div className="rounded-lg bg-zinc-800/50 p-3">
                            <Clock className="h-6 w-6 text-zinc-600" />
                          </div>
                          <p className="text-xs text-zinc-500">
                            Baixe o corte primeiro para visualizar o segmento exato.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
              <div className="flex gap-4 p-4">
                <div className="h-28 w-20 shrink-0 rounded-lg shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded shimmer" />
                  <div className="h-3 w-full rounded shimmer" />
                  <div className="h-3 w-1/2 rounded shimmer" />
                  <div className="h-8 w-full rounded-lg shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && cuts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-16 text-center">
          <Scissors className="mb-3 h-12 w-12 text-zinc-700" />
          <p className="text-sm text-zinc-500">
            Cole um link do YouTube, TikTok ou Instagram e gere 10 cortes virais prontos para postar
          </p>
        </div>
      )}
    </div>
  );
}

import { useCallback } from 'react';

function useCallbackRef<T extends (...args: never[]) => void>(fn: T): T {
  return useCallback(fn, []) as T;
}
