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

export default function ActiveProjects() {
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

    if (!profile) return;
    const { data } = await supabase
      .from('projects')
      .select('*, profiles!projects_company_id_fkey(name, id)')
      .eq('company_id', profile.id)
      .order(sortField as any, { ascending: !sortDir });
    if (data) setProjects(data as Project[]);
  }, [sort, profile]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useRealtime([
    { table: 'projects', filter: `company_id=eq.${profile?.id}`, onData: () => fetchProjects() },
  ], [sort, profile?.id]);

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tech_stack.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete project: ' + error.message);
    } else {
      toast.success('Project deleted');
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'open' | 'in_progress' | 'assigned' | 'completed' | 'cancelled') => {
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast.error('Failed to update status: ' + error.message);
    } else {
      toast.success(`Project marked as ${newStatus.replace('_', ' ')}`);
      // Notify team if status changes to in_progress
      if (newStatus === 'in_progress') {
        const project = projects.find(p => p.id === id);
        if (project) {
          const { data: teams } = await supabase.from('teams').select('leader_id').eq('project_id', id);
          if (teams && teams.length > 0) {
            for (const team of teams) {
              await sendNotification(team.leader_id, 'Project Started!', `"${project.title}" is now in progress. Start delivering milestones!`, 'info');
            }
          }
        }
      }
      fetchProjects();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} project{filtered.length !== 1 ? 's' : ''} under management</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="project-search"
            placeholder="Search your projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border-border shadow-sm"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-52 h-11 bg-card border-border shadow-sm" id="project-sort">
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
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/60 rounded-xl bg-card/50">
          <Sparkles className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No projects found</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Post a new project to start receiving bids from students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className="shadow-card border-border bg-card flex flex-col h-full"
            >
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight">{p.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary" className={`text-[10px] font-bold tracking-widest uppercase ${
                        p.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 
                        p.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 
                        'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        Added {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 bg-muted/30 px-3 py-2 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest pl-1 mb-0.5">Budget</p>
                    <p className="text-lg font-black text-foreground">${p.budget.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col flex-1">
                <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed mb-6 flex-1">
                  {p.description}
                </p>
                <div className="space-y-4 mt-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {p.tech_stack.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded bg-muted text-muted-foreground text-[11px] font-semibold border border-white/5 whitespace-nowrap">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                       <Select value={p.status} onValueChange={(val) => handleStatusChange(p.id, val as any)}>
                         <SelectTrigger className="h-9 text-xs font-semibold">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                    <Button variant="destructive" size="sm" className="h-9 font-bold" onClick={() => handleDelete(p.id)}>
                      Delete Project
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
