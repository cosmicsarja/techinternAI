import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Building, Trophy, Code2, Users, Briefcase, FileText } from 'lucide-react';
import { NavLink } from 'react-router-dom';
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
];

export default function WonProjects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at_desc');
  const [loading, setLoading] = useState(true);

  const fetchWonProjects = useCallback(async () => {
    if (!profile) return;
    
    // Get all projects where the student has an accepted bid
    const { data: bids } = await supabase
      .from('bids')
      .select('project_id')
      .eq('student_id', profile.id)
      .eq('status', 'accepted');
      
    if (!bids || bids.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }
    
    const projectIds = bids.map((b) => b.project_id);
    
    const [sortField, sortDir] = ['created_at', sort === 'created_at_desc' ? true : false];

    const { data } = await supabase
      .from('projects')
      .select('*, profiles!projects_company_id_fkey(name, id)')
      .in('id', projectIds)
      .order(sortField as any, { ascending: !sortDir });
      
    if (data) setProjects(data as Project[]);
    setLoading(false);
  }, [sort, profile]);

  useEffect(() => {
    fetchWonProjects();
  }, [fetchWonProjects]);

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tech_stack.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Won Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Projects where your bid was successfully accepted.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search won projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card shadow-sm border-border"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 bg-card shadow-sm border-border">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted/30 animate-pulse border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card/50 rounded-2xl border border-dashed border-border/60 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary/40" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No projects won yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Keep placing bids on open projects to build your portfolio and start earning.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <NavLink to="/dashboard/projects">Browse Open Projects</NavLink>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-slide-up">
          {filtered.map((p) => (
            <Card key={p.id} className="shadow-card border-border bg-card hover:border-primary/20 transition-colors flex flex-col h-full group">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary hover:bg-primary/20">{p.status.replace('_', ' ')}</Badge>
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 whitespace-nowrap">
                         Added {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{p.title}</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Building className="w-3.5 h-3.5" />
                      <span className="font-medium truncate">{p.profiles?.name}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 bg-muted/30 px-3 py-2 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest pl-1 mb-0.5">Budget</p>
                    <p className="text-lg font-black text-foreground">₹{p.budget.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 flex flex-col flex-1">
                <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed mb-6 flex-1">
                  {p.description}
                </p>
                <div className="space-y-4 mt-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {p.tech_stack?.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded bg-muted text-muted-foreground text-[11px] font-semibold border border-white/5 whitespace-nowrap">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" className="flex-1 font-semibold" asChild>
                        <NavLink to={`/dashboard/teams`}><Users className="w-4 h-4 mr-2" /> View Team</NavLink>
                     </Button>
                     <Button className="flex-1 gradient-primary text-primary-foreground font-semibold" asChild>
                        <NavLink to={`/dashboard/workspace`}><Code2 className="w-4 h-4 mr-2" /> Start Coding</NavLink>
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
