'use client';

import { useCallback } from 'react';
import { supabase, OWNER_EMAIL, CREDIT_COST, GOOGLE_BONUS, MONTHLY_PLAN_DAYS, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export type PlanType = 'none' | 'single' | 'monthly';

export function useCredits() {
  const { user, profile, refreshProfile } = useAuth();

  const isOwner = profile?.is_owner ?? (user?.email?.toLowerCase() === OWNER_EMAIL);

  const hasMonthly = (() => {
    if (!profile?.expires_at) return false;
    return new Date(profile.expires_at) > new Date();
  })();

  const hasUnlimited = isOwner || hasMonthly;

  const credits = isOwner ? 999999 : (profile?.credits ?? 0);

  const canAfford = hasUnlimited || credits >= CREDIT_COST;

  const consumeCredits = useCallback(
    async (amount: number = CREDIT_COST): Promise<boolean> => {
      if (!user || !profile) return false;
      if (isOwner) return true;
      if (hasMonthly) return true;
      if (profile.credits < amount) return false;

      const { error } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - amount })
        .eq('id', user.id);

      if (error) return false;
      await refreshProfile();
      return true;
    },
    [user, profile, isOwner, hasMonthly, refreshProfile]
  );

  const claimGoogleBonus = useCallback(async (): Promise<boolean> => {
    if (!user || !profile) return false;
    if (profile.google_bonus_claimed) return false;

    const { error } = await supabase
      .from('profiles')
      .update({
        credits: profile.credits + GOOGLE_BONUS,
        google_bonus_claimed: true,
      })
      .eq('id', user.id);

    if (error) return false;
    await refreshProfile();
    toast.success(`Você ganhou ${GOOGLE_BONUS} créditos grátis! Use 1 corte, 1 troca ou 1 vídeo.`);
    return true;
  }, [user, profile, refreshProfile]);

  const grantCredits = useCallback(
    async (email: string, amount: number, planType: PlanType): Promise<boolean> => {
      if (!isOwner) return false;

      const { data: target } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!target) return false;

      const updates: Partial<Profile> = {
        credits: (target.credits || 0) + amount,
      };

      if (planType === 'monthly') {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + MONTHLY_PLAN_DAYS);
        updates.expires_at = expiry.toISOString();
        updates.plan = 'monthly';
      } else if (planType === 'single') {
        updates.plan = 'single';
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', target.id);

      if (error) return false;
      return true;
    },
    [isOwner]
  );

  return {
    credits,
    isOwner,
    hasMonthly,
    hasUnlimited,
    canAfford,
    consumeCredits,
    claimGoogleBonus,
    grantCredits,
    refreshProfile,
  };
}
