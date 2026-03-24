import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, DollarSign, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';

const bidStatusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', label: 'Pending' },
  accepted: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', label: 'Accepted ✓' },
  rejected: { color: 'bg-red-500/15 text-red-400 border-red-500/20', label: 'Rejected' },
};

export default function MyBids() {
  const { profile } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchBids = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('bids')
      .select('*, projects(title, status, budget, company_id, profiles!projects_company_id_fkey(name))')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setBids(data);
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchBids(); }, [fetchBids]);

  useRealtime([
    { table: 'bids', filter: `student_id=eq.${profile?.id}`, onData: () => fetchBids() },
  ], [profile?.id]);

  const withdrawBid = async (bid: any) => {
    if (bid.status !== 'pending') { toast.error('Only pending bids can be withdrawn'); return; }
    setDeleting(bid.id);
    const { error } = await supabase.from('bids').delete().eq('id', bid.id);
    if (error) { toast.error(error.message); }
    else {
      setBids((prev) => prev.filter((b) => b.id !== bid.id));
      toast.success('Bid withdrawn');
    }
    setDeleting(null);
  };

  const totals = {
    pending: bids.filter((b) => b.status === 'pending').length,
    accepted: bids.filter((b) => b.status === 'accepted').length,
    rejected: bids.filter((b) => b.status === 'rejected').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bids</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{bids.length} total bid{bids.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Summary */}
      {bids.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending', value: totals.pending, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'Accepted', value: totals.accepted, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Rejected', value: totals.rejected, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
          ].map((s) => (
            <div key={s.label} className={`text-center p-3 rounded-xl border ${s.color}`}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />)}
        </div>
      ) : bids.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No bids yet</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Browse open projects to place your first bid</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bids.map((b) => {
            const { color, label } = bidStatusConfig[b.status] || bidStatusConfig.pending;
            return (
              <Card key={b.id} className={`shadow-card transition-all ${b.status === 'accepted' ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${color}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{b.projects?.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">by {b.projects?.profiles?.name || 'Unknown'}</p>
                        </div>
                        <Badge variant="secondary" className={`border text-[10px] shrink-0 ${color}`}>
                          {label}
                        </Badge>
                      </div>

                      {b.proposal && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{b.proposal}</p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <DollarSign className="w-3 h-3 text-primary" />${Number(b.bid_amount).toLocaleString()}
                        </span>
                        {b.timeline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{b.timeline}
                          </span>
                        )}
                        <span className="ml-auto">
                          {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {b.status === 'accepted' && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>You are now project leader! Go to Team Management to build your team.</span>
                        </div>
                      )}
                    </div>

                    {b.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => withdrawBid(b)}
                        disabled={deleting === b.id}
                        title="Withdraw bid"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
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
