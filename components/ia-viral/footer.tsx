'use client';

import { Check, Flame, Infinity as InfinityIcon, Shield, Sparkles } from 'lucide-react';

interface FooterProps {
  onBuyClick: () => void;
}

const benefits = [
  'Cortes virais ilimitados',
  'Troca de roupa e rosto sem limite',
  'Geração de vídeos com IA sem restrição',
  'Acesso a todos os prompts virais',
  'Sem marca d\'água',
  'Suporte dedicado',
];

export function Footer({ onBuyClick }: FooterProps) {
  return (
    <footer className="relative mt-16 border-t border-zinc-800/50">
      <div className="absolute inset-0 radial-fade" />
      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* CTA */}
        <div className="glass-strong relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
          <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
              <Flame className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">MAIS VENDIDO - 96% ESCOLHEM</span>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
              ACESSO TOTAL ILIMITADO
            </h2>
            <p className="mb-6 text-sm text-zinc-400">
              Pare de esperar. Gere conteúdo viral sem limites por R$25/mês.
            </p>

            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="text-4xl font-bold text-amber-400">R$25</span>
              <span className="text-sm text-zinc-500">/mês - 30 dias ilimitado</span>
            </div>

            <button
              onClick={onBuyClick}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-amber-500 px-8 py-4 text-base font-bold text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 sm:w-auto sm:px-12"
            >
              <InfinityIcon className="h-5 w-5" />
              LIBERAR ACESSO TOTAL - R$25/mês
              <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 group-hover:translate-x-full" />
            </button>

            <p className="mt-3 text-xs text-zinc-500">
              Ou pague R$1 por 1 uso avulso. Cancele quando quiser.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#00FF88]" /> Pagamento seguro via Pix
              </span>
              <span className="flex items-center gap-1.5">
                <InfinityIcon className="h-3.5 w-3.5 text-[#00FF88]" /> 30 dias ilimitado
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#00FF88]" /> Ativação instantânea
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-600">
            IA VIRAL ⚡ — Gerador de conteúdo viral com inteligência artificial
          </p>
        </div>
      </div>
    </footer>
  );
}
