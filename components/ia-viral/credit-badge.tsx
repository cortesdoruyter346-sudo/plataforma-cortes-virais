'use client';

import { Infinity as InfinityIcon, Coins, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CreditInfo {
  isOwner: boolean;
  hasMonthly: boolean;
  canAfford: boolean;
  credits: number;
}

export function CreditBadge({ info }: { info: CreditInfo }) {
  if (info.isOwner) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#00FF88]/30 bg-[#00FF88]/10 px-3 py-1.5 text-xs font-semibold text-[#00FF88]">
        <InfinityIcon className="h-3.5 w-3.5" /> Grátis (Dono)
      </span>
    );
  }

  if (info.hasMonthly) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
        <InfinityIcon className="h-3.5 w-3.5" /> Incluso no seu plano mensal
      </span>
    );
  }

  if (info.credits >= 100 && !info.canAfford) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-400">
        <Coins className="h-3.5 w-3.5 text-[#00FF88]" /> 100 créditos | R$1
      </span>
    );
  }

  if (info.credits === 100) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
        <Gift className="h-3.5 w-3.5" /> Usar meus 100 grátis
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-400">
      <Coins className="h-3.5 w-3.5 text-[#00FF88]" /> 100 créditos | R$1
    </span>
  );
}

export type ActionType = (actionName: string) => Promise<boolean>;
