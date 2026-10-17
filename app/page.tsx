'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Shirt, Smile, Video, Lightbulb } from 'lucide-react';
import { Header } from '@/components/ia-viral/header';
import { Footer } from '@/components/ia-viral/footer';
import { PricingModal } from '@/components/ia-viral/pricing-modal';
import { CortesViraisTab } from '@/components/ia-viral/cortes-virais-tab';
import { TrocaCorpoTab } from '@/components/ia-viral/troca-corpo-tab';
import { TrocaRostoTab } from '@/components/ia-viral/troca-rosto-tab';
import { CriarVideoTab } from '@/components/ia-viral/criar-video-tab';
import { PromptsViraisTab } from '@/components/ia-viral/prompts-virais-tab';
import { useAuth } from '@/lib/auth-context';
import { useCredits } from '@/hooks/use-credits';
import { supabase, GOOGLE_BONUS } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'cortes', label: 'Cortes Virais', icon: Scissors },
  { id: 'corpo', label: 'Troca Corpo', icon: Shirt },
  { id: 'rosto', label: 'Troca Rosto', icon: Smile },
  { id: 'criar', label: 'Criar Vídeo', icon: Video },
  { id: 'prompts', label: 'Prompts Virais', icon: Lightbulb },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('cortes');
  const [showPricing, setShowPricing] = useState(false);
  const { user, profile, loading } = useAuth();
  const { isOwner, hasMonthly, hasUnlimited, credits, canAfford, consumeCredits, claimGoogleBonus } = useCredits();

  // Claim Google bonus on first login with Google
  useEffect(() => {
    if (user && profile && !loading) {
      const isGoogleUser = user.app_metadata?.provider === 'google';
      if (isGoogleUser && !profile.google_bonus_claimed) {
        claimGoogleBonus();
      }
    }
  }, [user, profile, loading, claimGoogleBonus]);

  const handleBuyClick = () => setShowPricing(true);

  const handleActionWithCredits = async (actionName: string): Promise<boolean> => {
    if (!user) {
      toast.info('Faça login para usar a plataforma', {
        action: {
          label: 'Entrar',
          onClick: () => router.push('/login'),
        },
      });
      return false;
    }

    if (isOwner) return true;
    if (hasMonthly) return true;

    if (!canAfford) {
      setShowPricing(true);
      return false;
    }

    const success = await consumeCredits(100);
    if (!success) {
      setShowPricing(true);
      return false;
    }

    return true;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none fixed inset-0 radial-fade" />

      <div className="relative z-10">
        <Header onBuyClick={handleBuyClick} />

        {/* Hero section */}
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-8 text-center sm:px-6 sm:pt-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00FF88]/20 bg-[#00FF88]/5 px-4 py-1.5 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-[#00FF88] animate-pulse" />
            <span className="text-xs font-medium text-[#00FF88]">Powered by AI</span>
          </div>
          <h1 className="animate-fade-in-up text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl" style={{ animationDelay: '100ms' }}>
            Crie conteúdo <span className="gradient-text">viral</span> com IA
          </h1>
          <p className="mx-auto mt-4 max-w-2xl animate-fade-in-up text-sm text-zinc-400 sm:text-base" style={{ animationDelay: '200ms' }}>
            Gere cortes virais, troque roupas e rostos, crie vídeos do zero e use prompts prontos.
            Tudo em um só lugar, com inteligência artificial.
          </p>
        </section>

        {/* Tab Navigation */}
        <nav className="sticky top-[57px] z-40 mx-auto max-w-6xl px-2 sm:px-4">
          <div className="glass-strong rounded-2xl p-1.5">
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'group relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-300 sm:text-sm',
                      isActive
                        ? 'bg-[#00FF88] text-black neon-glow-sm'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Tab Content */}
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div key={activeTab} className="animate-fade-in-up">
            {activeTab === 'cortes' && <CortesViraisTab onAction={handleActionWithCredits} creditInfo={{ isOwner, hasMonthly, canAfford, credits }} />}
            {activeTab === 'corpo' && <TrocaCorpoTab onAction={handleActionWithCredits} creditInfo={{ isOwner, hasMonthly, canAfford, credits }} />}
            {activeTab === 'rosto' && <TrocaRostoTab onAction={handleActionWithCredits} creditInfo={{ isOwner, hasMonthly, canAfford, credits }} />}
            {activeTab === 'criar' && <CriarVideoTab onAction={handleActionWithCredits} creditInfo={{ isOwner, hasMonthly, canAfford, credits }} />}
            {activeTab === 'prompts' && <PromptsViraisTab onAction={handleActionWithCredits} creditInfo={{ isOwner, hasMonthly, canAfford, credits }} />}
          </div>
        </main>

        <Footer onBuyClick={handleBuyClick} />
      </div>

      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
}
