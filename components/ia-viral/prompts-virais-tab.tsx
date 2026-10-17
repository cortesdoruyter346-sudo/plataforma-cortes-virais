'use client';

import { useState } from 'react';
import { Copy, Check, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { viralPrompts } from '@/lib/prompts';
import { CreditBadge, type CreditInfo, type ActionType } from './credit-badge';

interface PromptsViraisTabProps {
  onAction: ActionType;
  creditInfo: CreditInfo;
}

export function PromptsViraisTab({ onAction, creditInfo }: PromptsViraisTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    const allowed = await onAction('Gerar Prompt');
    if (!allowed) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Prompt copiado para a área de transferência!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Não foi possível copiar o prompt');
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00FF88]/10 text-[#00FF88]">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Prompts Virais</h2>
            <p className="text-xs text-zinc-500">12 prompts prontos para copiar e usar</p>
          </div>
          <CreditBadge info={creditInfo} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {viralPrompts.map((prompt, i) => (
          <div
            key={prompt.id}
            className="group animate-fade-in-up relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-300 hover:border-[#00FF88]/30 hover:bg-zinc-900 hover:neon-glow-sm"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-[#00FF88]/10 px-2.5 py-1 text-[10px] font-medium text-[#00FF88]">
                {prompt.category}
              </span>
              <span className="text-xs text-zinc-600">#{prompt.id}</span>
            </div>

            <h3 className="mb-2 text-sm font-bold text-white">{prompt.title}</h3>

            <p className="mb-4 flex-1 text-xs leading-relaxed text-zinc-400 line-clamp-4">
              {prompt.text}
            </p>

            <button
              onClick={() => handleCopy(prompt.id, prompt.text)}
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-all duration-300 hover:border-[#00FF88]/40 hover:bg-[#00FF88]/10 hover:text-[#00FF88] group-hover:border-[#00FF88]/30"
            >
              {copiedId === prompt.id ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#00FF88]" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar prompt (100 créditos | R$1)
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
