'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, MessageCircle, Loader2, Crown, Flame, Infinity as InfinityIcon } from 'lucide-react';
import { supabase, SINGLE_PLAN_CREDITS, MONTHLY_PLAN_CREDITS, MONTHLY_PLAN_DAYS, type AppSettings } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useCredits } from '@/hooks/use-credits';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  plan: 'single' | 'monthly';
}

export function PaymentModal({ open, onClose, plan }: PaymentModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { isOwner } = useCredits();
  const [settings, setSettings] = useState<AppSettings>({ pix_key: null, whatsapp: null });
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (data) {
      setSettings({ pix_key: data.pix_key, whatsapp: data.whatsapp });
    }
    setLoadingSettings(false);
  }, [open]);

  useEffect(() => {
    if (open) loadSettings();
  }, [open, loadSettings]);

  if (!open) return null;

  const amount = plan === 'monthly' ? 25 : 1;
  const credits = plan === 'monthly' ? MONTHLY_PLAN_CREDITS : SINGLE_PLAN_CREDITS;
  const pixKey = settings.pix_key || 'iaviral@pix.com.br';
  const whatsapp = settings.whatsapp || '';
  const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${pixKey}5204000053039865802BR5913IA VIRAL6009SAO PAULO62${String(amount * 100).padStart(2, '0')}6304`;

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      toast.success('Chave Pix copiada!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleWhatsApp = () => {
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp}`, '_blank');
    } else {
      toast.info('WhatsApp ainda não configurado pelo administrador');
    }
  };

  const handleConfirm = async () => {
    if (!user || !profile) {
      toast.error('Faça login primeiro');
      return;
    }

    setConfirming(true);
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + MONTHLY_PLAN_DAYS);

      const updates: Record<string, unknown> = {
        credits: plan === 'monthly' ? MONTHLY_PLAN_CREDITS : (profile.credits || 0) + SINGLE_PLAN_CREDITS,
        plan: plan,
      };

      if (plan === 'monthly') {
        updates.expires_at = expiry.toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success(
        plan === 'monthly'
          ? `Acesso total liberado por ${MONTHLY_PLAN_DAYS} dias! Aproveite!`
          : '100 créditos liberados! Use 1 corte, 1 troca ou 1 vídeo.'
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao liberar acesso';
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-strong relative w-full max-w-md animate-scale-in rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className={cn(
            'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl animate-pulse-glow',
            plan === 'monthly' ? 'bg-amber-500/10' : 'bg-[#00FF88]/10'
          )}>
            {plan === 'monthly' ? (
              <Crown className="h-7 w-7 text-amber-400" />
            ) : (
              <Flame className="h-7 w-7 text-[#00FF88]" />
            )}
          </div>
          <h3 className="text-xl font-bold text-white">
            {plan === 'monthly' ? 'Acesso Total Mensal' : '1 Uso Avulso'}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            {plan === 'monthly'
              ? `Tudo ilimitado por ${MONTHLY_PLAN_DAYS} dias`
              : '100 créditos = 1 uso único'}
          </p>
        </div>

        {/* Price */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className={cn(
            'text-4xl font-bold',
            plan === 'monthly' ? 'text-amber-400' : 'text-[#00FF88]'
          )}>
            R$ {amount}
          </span>
          {plan === 'monthly' && (
            <span className="text-sm text-zinc-500">/mês</span>
          )}
        </div>

        {/* QR Code */}
        <div className="mb-4 flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
          {loadingSettings ? (
            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
          ) : (
            <div className="rounded-lg bg-white p-3">
              <QRCodeSVG value={pixPayload} size={180} level="M" />
            </div>
          )}
          <div className="w-full space-y-2">
            <p className="text-center text-xs text-zinc-500">Escaneie o QR Code ou copie a chave:</p>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <code className="truncate text-xs font-medium text-[#00FF88]">{pixKey}</code>
              <button
                onClick={handleCopyPix}
                className="flex shrink-0 items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-[#00FF88]"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-800 pt-2">
              <span className="text-xs text-zinc-500">Valor:</span>
              <span className="text-lg font-bold text-[#00FF88]">R$ {amount},00</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 space-y-1.5 text-xs text-zinc-400">
          <p className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00FF88]/10 text-[10px] font-bold text-[#00FF88]">1</span>
            Escaneie o QR Code ou copie a chave Pix
          </p>
          <p className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00FF88]/10 text-[10px] font-bold text-[#00FF88]">2</span>
            Faça o pagamento de R$ {amount},00
          </p>
          <p className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00FF88]/10 text-[10px] font-bold text-[#00FF88]">3</span>
            Envie o comprovante e aguarde liberação
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleWhatsApp}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 py-3 text-sm font-medium text-green-400 transition-all hover:bg-green-500/20"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar comprovante no WhatsApp
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming || !user}
            className={cn(
              'w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50',
              plan === 'monthly'
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-[#00FF88] text-black hover:bg-[#00FF88]/90'
            )}
          >
            {confirming ? (
              <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Liberando...</>
            ) : !user ? (
              'Faça login primeiro'
            ) : plan === 'monthly' ? (
              <><InfinityIcon className="mr-2 inline h-4 w-4" /> Já paguei - Liberar Tudo</>
            ) : (
              'Já paguei - Liberar 100 créditos'
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
