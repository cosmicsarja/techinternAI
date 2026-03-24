import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DollarSign, Building, Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { sendNotification } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';

export default function CompanyPayments() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('payments')
      .select('*, projects(title, recipient:profiles!projects_company_id_fkey(name))')
      .eq('payer_id', profile.id)
      .order('created_at', { ascending: false });
    
    // Default to empty array if query fails due to missing columns before migration
    if (data) setPayments(data);
    else if (error && error.code === '42703') setPayments([]); 
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useRealtime([{ table: 'payments', onData: fetchPayments }], [profile?.id]);

  const stats = {
    totalSpent: payments.filter((p) => p.status === 'released').reduce((a, b) => a + Number(b.amount), 0),
    lockedEscrow: payments.filter((p) => p.status === 'escrow').reduce((a, b) => a + Number(b.amount), 0),
    activeProjects: projectsCount(payments),
  };

  function projectsCount(p: any[]) {
    const ids = new Set(p.map(item => item.project_id));
    return ids.size;
  }

  const releaseEscrow = async (payment: any) => {
    setReleasing(payment.id);
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('id', payment.id);
      
      if (error) throw error;
      
      // Notify recipient that payment was released
      await sendNotification(
        payment.recipient_id,
        '💰 Payment Released!',
        `$${Number(payment.amount).toLocaleString()} has been released from escrow for "${payment.projects?.title}".`,
        'success'
      );
      
      toast.success('Payment released from escrow!');
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReleasing(null);
    }
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
          <h1 className="text-2xl font-bold text-foreground">Escrow & Financials</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Oversee project funding and milestone releases</p>
        </div>
        <Button className="gradient-primary text-primary-foreground font-semibold h-10 shadow-lg px-6">
          <DollarSign className="w-4 h-4 mr-2" /> Add Funding
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Investment', value: stats.totalSpent, icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Funds in Escrow', value: stats.lockedEscrow, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Financed Projects', value: stats.activeProjects, icon: Building, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map((s) => (
          <Card key={s.label} className="shadow-card border-none bg-card hover:bg-muted/5 transition-colors overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{typeof s.value === 'number' && s.label.includes('Investment') || s.label.includes('Escrow') ? `$${s.value.toLocaleString()}` : s.value}</p>
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
          <CardTitle className="text-base flex items-center gap-2 font-bold tracking-tight">
            <DollarSign className="w-5 h-5 text-primary" /> Expenditure History
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
              <p className="font-semibold text-muted-foreground">No financial activity recorded</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">Once you fund a project and release milestone payments, they will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((p) => {
                const { color, icon: Icon } = statusConfig[p.status] || statusConfig.pending;
                return (
                  <div key={p.id} className="p-5 flex items-center gap-4 justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-sm ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{p.projects?.title || 'System Charge'}</p>
                          <Badge variant="secondary" className={`text-[9px] py-0 font-bold border ${color}`}>{p.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          <span className="flex items-center gap-1 font-semibold text-foreground/80">Recipient ID: {p.recipient_id?.slice(0, 8)}...</span>
                          <span>•</span>
                          <span>Milestone Release</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0 gap-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">-${Number(p.amount).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                      </div>
                      {p.status === 'escrow' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => releaseEscrow(p)}
                          disabled={releasing === p.id}
                          className="text-xs h-8 px-3 font-semibold border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
                        >
                          {releasing === p.id ? 'Releasing...' : 'Release'}
                        </Button>
                      )}
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
