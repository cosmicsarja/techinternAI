import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Users, DollarSign, Clock } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { sendNotification } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';

const bidStatusColor: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  accepted: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  rejected: 'bg-red-500/15 text-red-400 border border-red-500/20',
};

const projectStatusColor: Record<string, string> = {
  open: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  assigned: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  in_progress: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  completed: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border border-red-500/20',
};

export default function ViewBids() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [bids, setBids] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!profile) return;
    const { data: projs } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', profile.id)
      .order('created_at', { ascending: false });

    if (projs) {
      setProjects(projs);
      // Expand open projects by default
      setExpanded(new Set(projs.filter((p) => p.status === 'open').map((p) => p.id)));
      const bidsByProject: Record<string, any[]> = {};
      await Promise.all(
        projs.map(async (p) => {
          const { data } = await supabase
            .from('bids')
            .select('*, profiles!bids_student_id_fkey(name, skill_score, avatar_url, bio)')
            .eq('project_id', p.id)
            .order('bid_amount', { ascending: true });
          if (data) bidsByProject[p.id] = data;
        })
      );
      setBids(bidsByProject);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useRealtime([
    { table: 'bids', event: 'INSERT', onData: () => fetchAll() },
    { table: 'bids', event: 'UPDATE', onData: () => fetchAll() },
    { table: 'projects', event: 'UPDATE', onData: () => fetchAll() },
  ], [profile?.id]);

  const acceptBid = async (bid: any, projectId: string) => {
    setAccepting(bid.id);
    try {
      // Accept this bid, reject others
      await Promise.all([
        supabase.from('bids').update({ status: 'accepted' }).eq('id', bid.id),
        supabase.from('bids').update({ status: 'rejected' }).eq('project_id', projectId).neq('id', bid.id),
        supabase.from('projects').update({ status: 'assigned' }).eq('id', projectId),
      ]);

      // Create team with student as leader
      await supabase.from('teams').insert({
        project_id: projectId,
        leader_id: bid.student_id,
      });

      // Escrow payment
      await supabase.from('payments').insert({
        project_id: projectId,
        amount: bid.bid_amount,
        status: 'escrow',
      });

      // Notify the student who won
      const project = projects.find((p) => p.id === projectId);
      await sendNotification(
        bid.student_id,
        '🎉 Bid Accepted!',
        `Your bid of $${Number(bid.bid_amount).toLocaleString()} on "${project?.title}" has been accepted! You are now the project leader.`,
        'success'
      );

      // Notify rejected students
      const rejectedBids = (bids[projectId] || []).filter((b) => b.id !== bid.id);
      await Promise.all(
        rejectedBids.map((rb) =>
          sendNotification(
            rb.student_id,
            'Bid Update',
            `Your bid on "${project?.title}" was not selected this time. Keep bidding!`,
            'info'
          )
        )
      );

      toast.success('Bid accepted! Student is now the project leader.');
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    }
    setAccepting(null);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">View & Select Bids</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">View & Select Bids</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No projects posted yet</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Post a project to start receiving bids</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const projectBids = bids[p.id] || [];
            const pendingCount = projectBids.filter((b) => b.status === 'pending').length;
            const isExpanded = expanded.has(p.id);

            return (
              <Card key={p.id} className="shadow-card overflow-hidden">
                {/* Project Header */}
                <button
                  className="w-full text-left"
                  onClick={() => toggleExpand(p.id)}
                >
                  <div className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground text-sm">{p.title}</h3>
                          <Badge variant="secondary" className={`text-[10px] border ${projectStatusColor[p.status] || ''}`}>
                            {p.status.replace('_', ' ')}
                          </Badge>
                          {pendingCount > 0 && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-[10px]">
                              {pendingCount} pending
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${Number(p.budget).toLocaleString()} budget</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{projectBids.length} bid{projectBids.length !== 1 ? 's' : ''}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </button>

                {/* Bids List */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {!projectBids.length ? (
                      <p className="text-sm text-muted-foreground p-4 text-center">No bids yet</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {projectBids.map((b) => (
                          <div key={b.id} className={`p-4 flex flex-col sm:flex-row sm:items-start gap-4 ${b.status === 'accepted' ? 'bg-emerald-500/5' : ''}`}>
                            {/* Avatar */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                                {b.profiles?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-foreground">{b.profiles?.name}</p>
                                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    Score: {b.profiles?.skill_score ?? '—'}
                                  </span>
                                  <Badge variant="secondary" className={`text-[10px] border ${bidStatusColor[b.status] || ''}`}>
                                    {b.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1 font-medium text-foreground">
                                    <DollarSign className="w-3 h-3 text-primary" />${Number(b.bid_amount).toLocaleString()}
                                  </span>
                                  {b.timeline && <span>⏱ {b.timeline}</span>}
                                  <span>{formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</span>
                                </div>
                                {b.proposal && (
                                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">{b.proposal}</p>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            {b.status === 'pending' && p.status === 'open' && (
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  id={`accept-bid-${b.id}`}
                                  onClick={() => acceptBid(b, p.id)}
                                  disabled={accepting === b.id}
                                  className="gradient-primary text-primary-foreground"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  {accepting === b.id ? 'Accepting...' : 'Accept'}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
