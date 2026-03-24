import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DollarSign, Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, AlertCircle, Building, Users } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';

export default function StudentPayments() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('payments')
      .select('*, projects(title, company_id, profiles!projects_company_id_fkey(name))')
      .eq('recipient_id', profile.id)
      .order('created_at', { ascending: false });
    
    // Default to empty array if query fails due to missing columns before migration
    if (data) setPayments(data);
    else if (error && error.code === '42703') setPayments([]);
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useRealtime([{ table: 'payments', onData: fetchPayments }], [profile?.id]);

  const stats = {
    total: payments.filter((p) => p.status === 'released').reduce((a, b) => a + Number(b.amount), 0),
    escrow: payments.filter((p) => p.status === 'escrow').reduce((a, b) => a + Number(b.amount), 0),
    lastMonth: payments
      .filter((p) => p.status === 'released' && new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((a, b) => a + Number(b.amount), 0),
  };

  const statusConfig: Record<string, { color: string; icon: any }> = {
    released: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    escrow: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: Clock },
    pending: { color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: AlertCircle },
    failed: { color: 'bg-red-500/15 text-red-400 border-red-500/20', icon: AlertCircle },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Earnings & Wallet</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your payouts and tracking earnings</p>
        </div>
        <Button className="gradient-primary text-primary-foreground font-semibold h-10 shadow-lg">
          <ArrowUpRight className="w-4 h-4 mr-2" /> Withdraw Funds
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Released Earnings', value: stats.total, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'In Escrow (Locked)', value: stats.escrow, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Last 30 Days', value: stats.lastMonth, icon: ArrowUpRight, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map((s) => (
          <Card key={s.label} className="shadow-card border-none bg-card hover:bg-muted/5 transition-colors overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">${s.value.toLocaleString()}</p>
              </div>
              <div className={`p-3 rounded-2xl ${s.bg} border border-white/5`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-border bg-card">
        <CardHeader className="pb-4 border-b border-border bg-muted/10">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" /> Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <Clock className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="font-semibold text-muted-foreground">No transactions found</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">Earnings from projects will appear here once milestones are reached.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((p) => {
                const { color, icon: Icon } = statusConfig[p.status] || statusConfig.pending;
                return (
                  <div key={p.id} className="p-5 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-sm ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">{p.projects?.title || 'System Reward'}</p>
                        <Badge variant="secondary" className={`text-[9px] py-0 font-bold border ${color}`}>{p.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {p.projects?.profiles?.name || 'Code Connect Hub'}</span>
                        <span>•</span>
                        <span>Milestone Payment</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0">
                      <p className="text-sm font-bold text-foreground">+${Number(p.amount).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
