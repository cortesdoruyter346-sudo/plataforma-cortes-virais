'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Users, DollarSign, Search, Loader2, Save, Gift, TrendingUp, Shield, LogOut } from 'lucide-react';
import { supabase, OWNER_EMAIL, SINGLE_PLAN_CREDITS, MONTHLY_PLAN_CREDITS, type Profile, type AppSettings } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useCredits, type PlanType } from '@/hooks/use-credits';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { grantCredits } = useCredits();

  const [pixKey, setPixKey] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlan, setGrantPlan] = useState<PlanType>('single');
  const [granting, setGranting] = useState(false);

  const [users, setUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isOwner = profile?.is_owner ?? (user?.email?.toLowerCase() === OWNER_EMAIL);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (data) {
      setPixKey(data.pix_key || '');
      setWhatsapp(data.whatsapp || '');
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isOwner) {
      router.push('/');
      return;
    }
    loadSettings();
    loadUsers();
  }, [user, isOwner, loading, router, loadSettings, loadUsers]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, pix_key: pixKey, whatsapp, updated_at: new Date().toISOString() });
    if (error) {
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações salvas!');
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    }
    setSavingSettings(false);
  };

  const handleGrant = async () => {
    if (!grantEmail.trim()) {
      toast.error('Digite o email do cliente');
      return;
    }
    setGranting(true);
    const amount = grantPlan === 'monthly' ? MONTHLY_PLAN_CREDITS : SINGLE_PLAN_CREDITS;
    const success = await grantCredits(grantEmail, amount, grantPlan);
    if (success) {
      toast.success(`Créditos liberados para ${grantEmail}!`);
      setGrantEmail('');
      loadUsers();
    } else {
      toast.error('Usuário não encontrado ou erro ao liberar');
    }
    setGranting(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayUsers = users.filter((u) => {
    const today = new Date();
    const created = new Date(u.created_at);
    return created.toDateString() === today.toDateString();
  });

  const monthlyActive = users.filter((u) => {
    if (!u.expires_at) return false;
    return new Date(u.expires_at) > new Date();
  });

  const singlePurchases = users.filter((u) => u.plan === 'single').length;
  const monthlyPurchases = monthlyActive.length;
  const todayRevenue = (todayUsers.length * 0) + singlePurchases * 1 + monthlyPurchases * 25;
  const monthlyRevenue = monthlyActive.length * 25;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00FF88]" />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-40" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00FF88]/10">
              <Shield className="h-5 w-5 text-[#00FF88]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Painel Admin</h1>
              <p className="text-xs text-zinc-500">DONO INFINITO - {user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-600"
            >
              Ver site
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:border-red-500/40 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <DollarSign className="h-3.5 w-3.5 text-[#00FF88]" /> Hoje
            </div>
            <p className="mt-1 text-xl font-bold text-[#00FF88]">R$ {todayRevenue}</p>
            <p className="text-[10px] text-zinc-600">{singlePurchases}x R$1 + {monthlyPurchases}x R$25</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <TrendingUp className="h-3.5 w-3.5 text-[#00FF88]" /> MRR
            </div>
            <p className="mt-1 text-xl font-bold text-[#00FF88]">R$ {monthlyRevenue}/mês</p>
            <p className="text-[10px] text-zinc-600">{monthlyActive.length} assinantes ativos</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Users className="h-3.5 w-3.5 text-[#00FF88]" /> Usuários
            </div>
            <p className="mt-1 text-xl font-bold text-white">{users.length}</p>
            <p className="text-[10px] text-zinc-600">{todayUsers.length} novos hoje</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Gift className="h-3.5 w-3.5 text-[#00FF88]" /> Bônus Google
            </div>
            <p className="mt-1 text-xl font-bold text-white">
              {users.filter((u) => u.google_bonus_claimed).length}
            </p>
            <p className="text-[10px] text-zinc-600">resgataram</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pix Settings */}
          <div className="glass rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#00FF88]" />
              <h2 className="text-sm font-bold text-white">Configurações Pix</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Chave Pix</label>
                <Input
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="seu-email@pix.com ou CPF/Celular"
                  className="border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">WhatsApp para comprovante</label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="5511999999999"
                  className="border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-600"
                />
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full bg-[#00FF88] text-black font-semibold hover:bg-[#00FF88]/90"
              >
                {savingSettings ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                ) : settingsSaved ? (
                  <><Save className="mr-2 h-4 w-4" /> Salvo!</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Salvar configurações</>
                )}
              </Button>
            </div>
          </div>

          {/* Grant Credits */}
          <div className="glass rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#00FF88]" />
              <h2 className="text-sm font-bold text-white">Liberar Créditos</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email do cliente</label>
                <Input
                  type="email"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Plano</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGrantPlan('single')}
                    className={cn(
                      'rounded-lg border px-3 py-2.5 text-xs font-medium transition-all',
                      grantPlan === 'single'
                        ? 'border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                    )}
                  >
                    R$1 - 100 créditos<br /><span className="text-[10px] opacity-60">1 uso avulso</span>
                  </button>
                  <button
                    onClick={() => setGrantPlan('monthly')}
                    className={cn(
                      'rounded-lg border px-3 py-2.5 text-xs font-medium transition-all',
                      grantPlan === 'monthly'
                        ? 'border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                    )}
                  >
                    R$25 - 10000 créditos<br /><span className="text-[10px] opacity-60">mensal 30 dias</span>
                  </button>
                </div>
              </div>
              <Button
                onClick={handleGrant}
                disabled={granting || !grantEmail.trim()}
                className="w-full bg-[#00FF88] text-black font-semibold hover:bg-[#00FF88]/90"
              >
                {granting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Liberando...</>
                ) : (
                  <>Liberar créditos</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="mt-6 glass rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#00FF88]" />
              <h2 className="text-sm font-bold text-white">Usuários ({users.length})</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por email..."
                className="h-9 w-48 border-zinc-800 bg-zinc-900/50 pl-9 text-xs text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Créditos</th>
                  <th className="pb-2 pr-4 font-medium">Plano</th>
                  <th className="pb-2 pr-4 font-medium">Expira</th>
                  <th className="pb-2 pr-4 font-medium">Google</th>
                  <th className="pb-2 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-zinc-600">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-zinc-600">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-zinc-800/50">
                      <td className="py-2.5 pr-4 text-zinc-300">{u.email}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn(
                          'font-medium',
                          u.is_owner ? 'text-[#00FF88]' : u.credits > 0 ? 'text-white' : 'text-zinc-600'
                        )}>
                          {u.is_owner ? 'INFINITO' : u.credits}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-medium',
                          u.is_owner ? 'bg-[#00FF88]/15 text-[#00FF88]' :
                          u.expires_at && new Date(u.expires_at) > new Date() ? 'bg-amber-500/15 text-amber-400' :
                          u.plan === 'single' ? 'bg-blue-500/15 text-blue-400' :
                          'bg-zinc-800 text-zinc-500'
                        )}>
                          {u.is_owner ? 'DONO' :
                           u.expires_at && new Date(u.expires_at) > new Date() ? 'MENSAL' :
                           u.plan === 'single' ? 'AVULSO' : 'FREE'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-500">
                        {u.expires_at ? new Date(u.expires_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-2.5 pr-4">
                        {u.google_bonus_claimed ? (
                          <span className="text-amber-400">Sim</span>
                        ) : (
                          <span className="text-zinc-600">Não</span>
                        )}
                      </td>
                      <td className="py-2.5 text-zinc-600">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
