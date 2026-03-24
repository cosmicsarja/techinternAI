import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import StatCard from '@/components/StatCard';
import {
  FolderOpen, FileText, DollarSign, Users, Trophy,
  BarChart3, TrendingUp, Clock, Activity, Zap, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';

const statusColor: Record<string, string> = {
  open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  assigned: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  completed: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const statusIcon: Record<string, React.FC<any>> = {
  open: Zap,
  assigned: Users,
  in_progress: Activity,
  completed: CheckCircle2,
  cancelled: AlertCircle,
};

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ projects: 0, bids: 0, earnings: 0, teams: 0, completed: 0 });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!profile) return;
    if (profile.role === 'student') {
      const [{ count: bids }, { count: teams }, { count: accepted }] = await Promise.all([
        supabase.from('bids').select('*', { count: 'exact', head: true }).eq('student_id', profile.id),
        supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase.from('bids').select('*', { count: 'exact', head: true }).eq('student_id', profile.id).eq('status', 'accepted'),
      ]);
      // Get earnings from released payments for projects where this student is leader
      const { data: leaderTeams } = await supabase.from('teams').select('project_id').eq('leader_id', profile.id);
      const projectIds = leaderTeams?.map((t) => t.project_id) || [];
      let earnings = 0;
      if (projectIds.length > 0) {
        const { data: pays } = await supabase.from('payments').select('amount').eq('status', 'released').in('project_id', projectIds);
        earnings = pays?.reduce((a, p) => a + Number(p.amount), 0) || 0;
      }
      setStats({ projects: 0, bids: bids || 0, earnings, teams: teams || 0, completed: accepted || 0 });
    } else if (profile.role === 'company') {
      const [{ count: projects }, { count: completed }, { data: payments }] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', profile.id),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', profile.id).eq('status', 'completed'),
        supabase.from('payments').select('amount, status, project_id').in('status', ['escrow', 'released']),
      ]);
      const total = payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
      setStats({ projects: projects || 0, bids: 0, earnings: total, teams: 0, completed: completed || 0 });
    } else {
      const [{ count: users }, { count: projects }, { data: payments }, { count: completed }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'released'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      ]);
      const revenue = payments?.reduce((a, p) => a + Number(p.amount), 0) || 0;
      setStats({ projects: projects || 0, bids: 0, earnings: revenue, teams: users || 0, completed: completed || 0 });
    }
  }, [profile]);

  const fetchRecentProjects = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, profiles!projects_company_id_fkey(name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(6);
    if (data) setRecentProjects(data);
  }, []);

  const fetchActivity = useCallback(async () => {
    if (!profile) return;
    // Fetch recent bids as activity
    const { data: bids } = await supabase
      .from('bids')
      .select('*, projects(title), profiles!bids_student_id_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(5);
    const { data: milestones } = await supabase
      .from('milestones')
      .select('*, projects(title)')
      .order('created_at', { ascending: false })
      .limit(5);

    const activity = [
      ...(bids || []).map((b: any) => ({
        ...b, _type: 'bid', _time: b.created_at,
        _label: `${b.profiles?.name} bid $${Number(b.bid_amount).toLocaleString()} on`,
        _project: b.projects?.title,
      })),
      ...(milestones || []).map((m: any) => ({
        ...m, _type: 'milestone', _time: m.created_at,
        _label: `Milestone "${m.title}" created for`,
        _project: m.projects?.title,
      })),
    ].sort((a, b) => new Date(b._time).getTime() - new Date(a._time).getTime()).slice(0, 7);

    setRecentActivity(activity);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    Promise.all([fetchStats(), fetchRecentProjects(), fetchActivity()]);
  }, [fetchStats, fetchRecentProjects, fetchActivity]);

  // Real-time: refresh stats & projects on any project/bid change
  useRealtime([
    { table: 'projects', onData: () => { fetchStats(); fetchRecentProjects(); fetchActivity(); } },
    { table: 'bids', onData: () => { fetchStats(); fetchActivity(); } },
    { table: 'payments', onData: () => fetchStats() },
  ], [profile?.id]);

  const studentCards = [
    { title: 'My Bids', value: stats.bids, icon: FileText, variant: 'primary' as const, sub: 'Total submitted' },
    { title: 'Won Projects', value: stats.completed, icon: Trophy, variant: 'accent' as const, sub: 'Bids accepted' },
    { title: 'Skill Score', value: profile?.skill_score || 0, icon: TrendingUp, variant: 'warning' as const, sub: 'Reputation points' },
    { title: 'Earnings', value: `$${stats.earnings.toLocaleString()}`, icon: DollarSign, variant: 'default' as const, sub: 'Released payments' },
  ];

  const companyCards = [
    { title: 'Posted Projects', value: stats.projects, icon: FolderOpen, variant: 'primary' as const, sub: 'All time' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle2, variant: 'accent' as const, sub: 'Finished projects' },
    { title: 'In Escrow/Paid', value: `$${stats.earnings.toLocaleString()}`, icon: DollarSign, variant: 'warning' as const, sub: 'Total spend' },
    { title: 'Active Teams', value: stats.teams, icon: Users, variant: 'default' as const, sub: 'Running now' },
  ];

  const adminCards = [
    { title: 'Total Users', value: stats.teams, icon: Users, variant: 'primary' as const, sub: 'Registered' },
    { title: 'Total Projects', value: stats.projects, icon: FolderOpen, variant: 'accent' as const, sub: 'All time' },
    { title: 'Revenue', value: `$${stats.earnings.toLocaleString()}`, icon: DollarSign, variant: 'warning' as const, sub: 'Released' },
    { title: 'Completed', value: stats.completed, icon: BarChart3, variant: 'default' as const, sub: 'Finished projects' },
  ];

  const cards = profile?.role === 'student' ? studentCards : profile?.role === 'company' ? companyCards : adminCards;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, <span className="text-primary">{profile?.name || 'User'}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success font-medium">Live</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Projects */}
        <Card className="shadow-card lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Projects</CardTitle>
            <span className="text-xs text-muted-foreground">{recentProjects.length} project{recentProjects.length !== 1 ? 's' : ''}</span>
          </CardHeader>
          <CardContent className="p-0">
            {recentProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4">No projects yet</p>
            ) : (
              <div className="divide-y divide-border">
                {recentProjects.map((p) => {
                  const Icon = statusIcon[p.status] || FolderOpen;
                  return (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{p.profiles?.name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">${Number(p.budget).toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`text-[10px] border ${statusColor[p.status] || ''} shrink-0`}>
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No recent activity</p>
            ) : (
              <div className="divide-y divide-border">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${a._type === 'bid' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                      {a._type === 'bid' ? '$' : '⚑'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-foreground">
                        <span className="text-muted-foreground">{a._label}</span>{' '}
                        <span className="font-medium truncate">{a._project}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(a._time), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
