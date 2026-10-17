'use client';

import { useState, useEffect, useCallback } from 'react';
import { Flame, Crown, Infinity as InfinityIcon, Check, AlertCircle } from 'lucide-react';
import { PaymentModal } from './payment-modal';
import { useCredits } from '@/hooks/use-credits';
import { cn } from '@/lib/utils';

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
}

export function PricingModal({ open, onClose }: PricingModalProps) {
  const { credits, isOwner, hasMonthly } = useCredits();
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'monthly'>('monthly');
  const [showPayment, setShowPayment] = useState(false);

  if (!open) return null;

  const canUse = isOwner || hasMonthly || credits >= 100;

  return (
    <>
      <div
        className="fixed inset-0 z-[99] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="glass-strong relative w-full max-w-2xl animate-scale-in rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00FF88]/10 animate-pulse-glow">
              <Flame className="h-7 w-7 text-[#00FF88]" />
            </div>
            <h2 className="text-2xl font-bold text-white">Desbloqueie o poder total!</h2>
            <p className="mt-1 text-sm text-zinc-400">Escolha o plano ideal para você</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* R$1 Avulso */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">1 Uso Avulso</h3>
                <p className="text-xs text-zinc-500">100 créditos - uso único</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#00FF88]">R$ 1</span>
                <span className="text-sm text-zinc-500">,00</span>
              </div>
              <ul className="mb-6 space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#00FF88]" />
                  1 Corte OU 1 Corpo OU 1 Rosto
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#00FF88]" />
                  OU 1 Vídeo OU 1 Prompt
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#00FF88]" />
                  Ativação instantânea
                </li>
              </ul>
              <button
                onClick={() => {
                  setSelectedPlan('single');
                  setShowPayment(true);
                }}
                className="w-full rounded-xl border border-[#00FF88]/30 bg-[#00FF88]/10 py-3 text-sm font-bold text-[#00FF88] transition-all hover:bg-[#00FF88]/20"
              >
                Pagar R$1 no Pix
              </button>
            </div>

            {/* R$25 Mensal - Destaque */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-zinc-900/50 p-6 animate-pulse-glow">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-xl bg-amber-500 px-4 py-1 text-[10px] font-bold text-black">
                MAIS VENDIDO - 96% ESCOLHEM
              </div>
              <div className="mb-4 mt-3">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <InfinityIcon className="h-5 w-5 text-amber-400" />
                  Acesso Total Mensal
                </h3>
                <p className="text-xs text-zinc-500">10000 créditos - 30 dias</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-amber-400">R$ 25</span>
                <span className="text-sm text-zinc-500">/mês</span>
              </div>
              <ul className="mb-6 space-y-2 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  Cortes ILIMITADOS
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  Corpo/Rosto ILIMITADOS
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  Vídeos ILIMITADOS
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  Prompts ILIMITADOS
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  Sem marca d'água
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  30 dias de acesso
                </li>
              </ul>
              <button
                onClick={() => {
                  setSelectedPlan('monthly');
                  setShowPayment(true);
                }}
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/30"
              >
                Pagar R$25 no Pix - Liberar Tudo
              </button>
              <p className="mt-2 text-center text-[10px] text-zinc-500">Cancele quando quiser</p>
            </div>
          </div>

          {canUse && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-[#00FF88]/20 bg-[#00FF88]/5 px-4 py-2 text-xs text-[#00FF88]">
              <Check className="h-3.5 w-3.5" />
              Você já tem créditos suficientes para usar a plataforma
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-4 w-full py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Voltar
          </button>
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        plan={selectedPlan}
      />
    </>
  );
}
