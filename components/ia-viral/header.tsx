'use client';

import { useRouter } from 'next/navigation';
import { Zap, LogIn, Coins, Settings, LogOut, Infinity as InfinityIcon, Gift, Crown } from 'lucide-react';
import { supabase, OWNER_EMAIL } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useCredits } from '@/hooks/use-credits';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onBuyClick: () => void;
}

export function Header({ onBuyClick }: HeaderProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { isOwner, hasMonthly, credits } = useCredits();

  const isOwnerUser = profile?.is_owner ?? (user?.email?.toLowerCase() === OWNER_EMAIL);
  const hasGoogleBonus = !isOwner && !hasMonthly && profile?.google_bonus_claimed && credits === 100;
  const hasPaidCredits = !isOwner && !hasMonthly && credits >= 100 && !profile?.google_bonus_claimed;
  const hasNoCredits = !isOwner && !hasMonthly && credits < 100;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Você saiu da sua conta');
  };

  const expiryDate = profile?.expires_at
    ? new Date(profile.expires_at).toLocaleDateString('pt-BR')
    : '';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/50 glass-strong">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <button onClick={() => router.push('/')} className="flex items-center gap-2">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#00FF88]/10 animate-pulse-glow">
            <Zap className="h-5 w-5 text-[#00FF88]" fill="#00FF88" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tracking-tight text-white">IA VIRAL</span>
            <span className="text-lg">⚡</span>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-full bg-zinc-800" />
          ) : !user ? (
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm font-medium text-white transition-all hover:border-amber-500/50"
            >
              <LogIn className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Entrar - Ganhe 100 grátis no Google</span>
              <span className="sm:hidden">Entrar</span>
            </button>
          ) : (
            <>
              {/* Credit/Plan display */}
              {isOwnerUser ? (
                <div className="flex items-center gap-1.5 rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-3 py-1.5">
                  <InfinityIcon className="h-3.5 w-3.5 text-[#00FF88]" />
                  <span className="text-xs font-semibold text-[#00FF88]">DONO INFINITO</span>
                  <button
                    onClick={() => router.push('/admin')}
                    className="ml-1 flex items-center gap-1 text-[#00FF88] hover:text-white"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : hasMonthly ? (
                <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">
                    ACESSO TOTAL até {expiryDate}
                  </span>
                </div>
              ) : hasGoogleBonus ? (
                <button
                  onClick={onBuyClick}
                  className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5"
                >
                  <Gift className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">100 créditos grátis (1 uso) - Presente Google</span>
                </button>
              ) : hasPaidCredits ? (
                <button
                  onClick={onBuyClick}
                  className="flex items-center gap-1.5 rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-3 py-1.5"
                >
                  <Coins className="h-3.5 w-3.5 text-[#00FF88]" />
                  <span className="text-xs font-medium text-[#00FF88]">{credits} créditos (1 uso)</span>
                </button>
              ) : hasNoCredits ? (
                <button
                  onClick={onBuyClick}
                  className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5"
                >
                  <Coins className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs font-medium text-red-400">0 créditos | Comprar R$1 ou R$25/mês</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5">
                  <Coins className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-400">{credits} créditos</span>
                </div>
              )}

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 transition-all hover:border-red-500/40 hover:text-red-400"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
