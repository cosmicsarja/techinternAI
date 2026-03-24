import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, DollarSign, Calendar, Code2, SlidersHorizontal, Sparkles, ArrowUpRight } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { sendNotification } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  budget: number;
  deadline: string | null;
  status: string;
  company_id: string;
  created_at: string;
  profiles?: { name: string; id: string };
}

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'created_at_desc' },
  { label: 'Oldest first', value: 'created_at_asc' },
  { label: 'Budget: High to Low', value: 'budget_desc' },
  { label: 'Budget: Low to High', value: 'budget_asc' },
];

export default function BrowseProjects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at_desc');
  const [bidProject, setBidProject] = useState<Project | null>(null);
  const [proposal, setProposal] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [timeline, setTimeline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myBidIds, setMyBidIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    const [sortField, sortDir] = sort.includes('budget')
      ? ['budget', sort === 'budget_desc' ? true : false]
      : ['created_at', sort === 'created_at_desc' ? true : false];

    const { data } = await supabase
      .from('projects')
      .select('*, profiles!projects_company_id_fkey(name, id)')
      .eq('status', 'open')
      .order(sortField as any, { ascending: !sortDir });
    if (data) setProjects(data as Project[]);
  }, [sort]);

  const fetchMyBids = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('bids').select('project_id').eq('student_id', profile.id);
    if (data) setMyBidIds(new Set(data.map((b) => b.project_id)));
  }, [profile]);

  useEffect(() => {
    fetchProjects();
    fetchMyBids();
  }, [fetchProjects, fetchMyBids]);

  // Realtime – new projects show up immediately
  useRealtime([
    { table: 'projects', event: 'INSERT', onData: () => fetchProjects() },
    { table: 'projects', event: 'UPDATE', onData: () => fetchProjects() },
    { table: 'bids', event: 'INSERT', onData: () => fetchMyBids() },
  ], [sort, profile?.id]);

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tech_stack.some((t) => t.toLowerCase().includes(q))
    );
  });

  const submitBid = async () => {
    if (!profile || !bidProject) return;
    if (!proposal.trim() || !bidAmount) {
      toast.error('Proposal and bid amount are required');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('bids').insert({
      project_id: bidProject.id,
      student_id: profile.id,
      proposal,
      bid_amount: parseFloat(bidAmount),
      timeline,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Bid submitted! The company will review your proposal.');
      // Notify the company
      if (bidProject.profiles?.id) {
        await sendNotification(
          bidProject.profiles.id,
          'New bid received',
          `${profile.name} submitted a $${parseFloat(bidAmount).toLocaleString()} bid on "${bidProject.title}"`,
          'info'
        );
      }
      setMyBidIds((prev) => new Set([...prev, bidProject.id]));
      setOpen(false);
      setBidProject(null);
      setProposal('');
      setBidAmount('');
      setTimeline('');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Browse Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} open project{filtered.length !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="project-search"
            placeholder="Search by title, description or tech..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-52" id="project-sort">
            <SlidersHorizontal className="w-3 h-3 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No open projects found</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting your search or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const alreadyBid = myBidIds.has(p.id);
            return (
              <Card
                key={p.id}
                className={`shadow-card hover:shadow-elevated transition-all duration-200 flex flex-col border-border ${alreadyBid ? 'border-primary/30' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{p.title}</CardTitle>
                    <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] shrink-0">
                      Open
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">by {p.profiles?.name || 'Unknown'}</p>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{p.description}</p>
                  {p.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.tech_stack.slice(0, 5).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] py-0">
                          <Code2 className="w-2.5 h-2.5 mr-1" />{t}
                        </Badge>
                      ))}
                      {p.tech_stack.length > 5 && (
                        <Badge variant="outline" className="text-[10px] py-0">+{p.tech_stack.length - 5}</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <DollarSign className="w-3.5 h-3.5 text-primary" />${Number(p.budget).toLocaleString()}
                    </span>
                    {p.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{new Date(p.deadline).toLocaleDateString()}
                      </span>
                    )}
                    <span className="ml-auto">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                  </div>

                  {profile?.role === 'student' && (
                    alreadyBid ? (
                      <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/5 border border-primary/20">
                        <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-primary font-medium">Bid submitted</span>
                      </div>
                    ) : (
                      <Dialog open={open && bidProject?.id === p.id}
                        onOpenChange={(o) => { if (!o) { setBidProject(null); setOpen(false); } }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="w-full gradient-primary text-primary-foreground"
                            onClick={() => { setBidProject(p); setOpen(true); }}
                          >
                            Place Bid
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Bid on: {p.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-1">
                            <div className="p-3 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground">
                              Budget: <span className="font-semibold text-foreground">${Number(p.budget).toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bid-proposal">Proposal *</Label>
                              <Textarea
                                id="bid-proposal"
                                value={proposal}
                                onChange={(e) => setProposal(e.target.value)}
                                placeholder="Why are you the best fit? Include your experience, approach, and what makes your solution unique..."
                                rows={5}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="bid-amount">Bid Amount ($) *</Label>
                                <Input
                                  id="bid-amount"
                                  type="number"
                                  value={bidAmount}
                                  onChange={(e) => setBidAmount(e.target.value)}
                                  placeholder="1000"
                                  min="0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="bid-timeline">Timeline</Label>
                                <Input
                                  id="bid-timeline"
                                  value={timeline}
                                  onChange={(e) => setTimeline(e.target.value)}
                                  placeholder="e.g. 2 weeks"
                                />
                              </div>
                            </div>
                            <Button
                              id="submit-bid-btn"
                              onClick={submitBid}
                              disabled={submitting || !proposal.trim() || !bidAmount}
                              className="w-full gradient-primary text-primary-foreground"
                            >
                              {submitting ? 'Submitting...' : 'Submit Bid'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
