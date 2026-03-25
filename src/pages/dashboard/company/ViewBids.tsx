import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Users, DollarSign, Clock, Star, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { sendNotification } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';

const bidStatusColor: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
  accepted: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
  rejected: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/20',
};

const projectStatusColor: Record<string, string> = {
  open: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
  assigned: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
  in_progress: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
  completed: 'bg-purple-500/15 text-purple-500 border-purple-500/20',
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
    const { data: projs } = await supabase.from('projects').select('*').eq('company_id', profile.id).order('created_at', { ascending: false });
    if (projs) {
      setProjects(projs);
      const bidsByProject: Record<string, any[]> = {};
      await Promise.all(projs.map(async (p) => {
        const { data } = await supabase.from('bids').select('*, profiles!bids_student_id_fkey(*)').eq('project_id', p.id).order('bid_amount', { ascending: true });
        if (data) bidsByProject[p.id] = data;
      }));
      setBids(bidsByProject);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRealtime([{ table: 'bids', onData: fetchAll }, { table: 'projects', onData: fetchAll }], [profile?.id]);

  const acceptBid = async (bid: any, projectId: string) => {
    setAccepting(bid.id);
    try {
      const projectTitle = projects.find(p => p.id === projectId)?.title || 'Project';
      
      // Get all other bids to notify rejections
      const { data: otherBids } = await supabase
        .from('bids')
        .select('student_id')
        .eq('project_id', projectId)
        .neq('id', bid.id)
        .eq('status', 'pending');
      
      const rejectionPromises = (otherBids || []).map(b =>
        sendNotification(b.student_id, '💬 Proposal Update', `Your proposal for "${projectTitle}" was not selected this time. Keep bidding!`, 'warning')
      );
      
      await Promise.all([
        supabase.from('bids').update({ status: 'accepted' }).eq('id', bid.id),
        supabase.from('bids').update({ status: 'rejected' }).eq('project_id', projectId).neq('id', bid.id),
        supabase.from('projects').update({ status: 'assigned' }).eq('id', projectId),
        supabase.from('teams').insert({ project_id: projectId, leader_id: bid.student_id }),
        supabase.from('payments').insert({ project_id: projectId, amount: bid.bid_amount, status: 'escrow', payer_id: profile?.id, recipient_id: bid.student_id }),
        sendNotification(bid.student_id, '🎉 Bid Accepted!', `Your bid on "${projectTitle}" has been accepted! Check your Won Projects.`, 'success'),
        ...rejectionPromises
      ]);
      toast.success('Bid accepted! Team created. Project assigned.');
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
    setAccepting(null);
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Proposals & Bids</h1>
        <p className="text-sm text-muted-foreground">Select the most qualified talent for your active projects</p>
      </div>

      {projects.length === 0 ? (
        <Card className="py-20 text-center border-dashed border-2">
          <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-bold text-lg">No Listings Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Post your first project to receive high-quality student bids.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map((p) => {
            const projectBids = bids[p.id] || [];
            const isExpanded = expanded.has(p.id);
            const pending = projectBids.filter(b => b.status === 'pending').length;

            return (
              <Card key={p.id} className={`overflow-hidden border-none shadow-elevated transition-all ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
                <div className="bg-card w-full text-left" onClick={() => toggleExpand(p.id)}>
                   <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted/10 transition-colors">
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-foreground truncate">{p.title}</h3>
                            <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${projectStatusColor[p.status]}`}>{p.status.replace('_', ' ')}</Badge>
                         </div>
                         <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                            <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> ${Number(p.budget).toLocaleString()}</span>
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {projectBids.length} Applicants</span>
                            {pending > 0 && <span className="text-amber-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {pending} New Bids</span>}
                         </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">{isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</Button>
                   </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/5">
                    {projectBids.length === 0 ? (
                      <div className="p-12 text-center text-xs text-muted-foreground italic tracking-widest uppercase">Awaiting initial proposals...</div>
                    ) : (
                      <div className="divide-y divide-border/50 p-4 space-y-4">
                        {projectBids.map((b) => (
                          <div key={b.id} className={`group relative p-6 rounded-2xl border transition-all ${b.status === 'accepted' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-card border-border hover:border-primary/30 shadow-sm'}`}>
                            <div className="flex flex-col md:flex-row gap-6">
                               {/* Applicant Info */}
                               <div className="md:w-64 space-y-4 shrink-0">
                                  <div className="flex items-center gap-3">
                                     <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-lg font-black shadow-lg">
                                        {b.profiles?.name?.charAt(0).toUpperCase()}
                                     </div>
                                     <div>
                                        <p className="font-bold text-foreground flex items-center gap-1.5">{b.profiles?.name} {b.profiles?.skill_score > 80 && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Score: {b.profiles?.skill_score || 0}</p>
                                     </div>
                                  </div>
                                  <div className="space-y-2">
                                     <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase">
                                        <span>Candidate Bid</span>
                                        <span className="text-foreground font-bold">₹{Number(b.bid_amount).toLocaleString()}</span>
                                     </div>
                                     <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase">
                                        <span>Timeline</span>
                                        <span className="text-foreground font-bold">{b.timeline || 'Flexible'}</span>
                                     </div>
                                  </div>
                               </div>

                               {/* Proposal Content */}
                               <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-3">
                                     <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-widest ${bidStatusColor[b.status]}`}>{b.status}</Badge>
                                     <span className="text-[10px] text-muted-foreground font-medium">{formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">"{b.proposal || 'No additional details provided.'}"</p>
                                  <div className="flex items-center gap-3">
                                     {b.status === 'pending' && p.status === 'open' && (
                                       <Button size="sm" className="gradient-primary text-primary-foreground font-bold h-9 px-6 shadow-lg shadow-primary/20" onClick={() => acceptBid(b, p.id)} disabled={!!accepting}>
                                          {accepting === b.id ? 'Formalizing...' : 'Accept Proposal'} <ArrowRight className="w-4 h-4 ml-1.5" />
                                       </Button>
                                     )}
                                     {b.status === 'accepted' && (
                                       <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                                          <CheckCircle className="w-4 h-4" /> Selected Partner
                                       </div>
                                     )}
                                  </div>
                               </div>
                            </div>
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
