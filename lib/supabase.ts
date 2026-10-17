'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const OWNER_EMAIL = 'beijo.2007.2007@gmail.com';
export const CREDIT_COST = 100;
export const GOOGLE_BONUS = 100;
export const SINGLE_PLAN_CREDITS = 100;
export const MONTHLY_PLAN_CREDITS = 10000;
export const MONTHLY_PLAN_DAYS = 30;

export interface Profile {
  id: string;
  email: string;
  credits: number;
  is_owner: boolean;
  expires_at: string | null;
  google_bonus_claimed: boolean;
  plan: string;
  created_at: string;
}

export interface AppSettings {
  pix_key: string | null;
  whatsapp: string | null;
}
