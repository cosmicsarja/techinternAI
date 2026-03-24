import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DollarSign, ArrowUpRight, CheckCircle, Lock, Unlock, TrendingUp, RefreshCw } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { sendNotification } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  escrow: { label: 'In Escrow', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: Lock },
  released: { label: 'Released', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: Unlock },
  refunded: { label: 'Refunded', color: 'bg-slate-500/15 text-slate-400 border-slate-500/20', icon: RefreshCw },
};

export default function Payments() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [releasing, setReleasing] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!profile) return;
    let query = supabase
      .from('payments')
      .select('*, projects(title, company_id, company:profiles!projects_company_id_fkey(name))')
      .order('created_at', { ascending: false });

    // For companies, filter to their own projects
    if (profile.role === 'company') {
      const { data: myProjects } = await supabase.from('projects').select('id').eq('company_id', profile.id);
      const ids = myProjects?.map((p) => p.id) || [];
      if (ids.length === 0) { setPayments([]); return; }
      query = query.in('project_id', ids);
    } else if (profile.role === 'student') {
      // Show payments for projects where this student is leader
      const { data: leaderTeams } = await supabase.from('teams').select('project_id').eq('leader_id', profile.id);
      const ids = leaderTeams?.map((t) => t.project_id) || [];
      if (ids.length === 0) { setPayments([]); return; }
      query = query.in('project_id', ids);
    }

    const { data } = await query;
    if (data) setPayments(data);
  }, [profile]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useRealtime([
    { table: 'payments', onData: () => fetchPayments() },
  ], [profile?.id]);

  const releasePayment = async (payment: any) => {
    setReleasing(payment.id);
    const { error } = await supabase.from('payments').update({
      status: 'released',
      released_at: new Date().toISOString(),
    }).eq('id', payment.id);

    if (error) {
      toast.error(error.message);
    } else {
      // Notify team leader
      const { data: team } = await supabase
        .from('teams')
        .select('leader_id')
        .eq('project_id', payment.project_id)
        .single();
      if (team) {
        await sendNotification(
          team.leader_id,
          '💰 Payment Released!',
          `$${Number(payment.amount).toLocaleString()} for "${payment.projects?.title}" has been released. Congratulations!`,
          'success'
        );
      }
      // Mark project as completed
      await supabase.from('projects').update({ status: 'completed' }).eq('id', payment.project_id);
      toast.success('Payment released and project marked complete!');
      fetchPayments();
    }
    setReleasing(null);
  };

  const totalEscrow = payments.filter((p) => p.status === 'escrow').reduce((a, p) => a + Number(p.amount), 0);
  const totalReleased = payments.filter((p) => p.status === 'released').reduce((a, p) => a + Number(p.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {profile?.role === 'student' ? 'Earnings' : 'Payments'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{payments.length} transaction{payments.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Summary Cards */}
      {payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Escrow</p>
                <p className="text-xl font-bold text-foreground">${totalEscrow.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{profile?.role === 'student' ? 'Total Earned' : 'Total Released'}</p>
                <p className="text-xl font-bold text-foreground">${totalReleased.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <DollarSign className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No payments yet</p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            {profile?.role === 'student' ? 'Win a project bid to get started' : 'Accept a bid to create an escrow payment'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const { color, icon: Icon } = statusConfig[p.status] || statusConfig.escrow;
            return (
              <Card key={p.id} className="shadow-card hover:shadow-elevated transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{p.projects?.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="font-bold text-base text-foreground">${Number(p.amount).toLocaleString()}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                      {p.released_at && (
                        <>
                          <span>•</span>
                          <span>Released {formatDistanceToNow(new Date(p.released_at), { addSuffix: true })}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(profile?.role === 'company' || profile?.role === 'admin') && p.status === 'escrow' && (
                      <Button
                        size="sm"
                        id={`release-payment-${p.id}`}
                        onClick={() => releasePayment(p)}
                        disabled={releasing === p.id}
                        className="gradient-primary text-primary-foreground"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                        {releasing === p.id ? 'Releasing...' : 'Release'}
                      </Button>
                    )}
                    <Badge variant="secondary" className={`text-[10px] border ${color}`}>
                      {statusConfig[p.status]?.label || p.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
