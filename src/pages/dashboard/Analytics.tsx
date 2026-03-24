import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/StatCard';
import { Users, FolderOpen, DollarSign, BarChart3, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { useRealtime } from '@/hooks/useRealtime';

const COLORS = ['hsl(220, 80%, 55%)', 'hsl(160, 60%, 45%)', 'hsl(40, 90%, 55%)', 'hsl(280, 60%, 55%)', 'hsl(0, 70%, 55%)'];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analytics() {
  const { profile } = useAuth();
  const [data, setData] = useState({
    users: 0, projects: 0, revenue: 0, bids: 0, milestones: 0, teams: 0,
  });
  const [projectStatusData, setProjectStatusData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [roleData, setRoleData] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    const [
      { count: users },
      { count: projects },
      { count: bids },
      { count: milestones },
      { count: teams },
      { data: payments },
      { data: allProjects },
      { data: profiles },
      { data: recentBids },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('bids').select('*', { count: 'exact', head: true }),
      supabase.from('milestones').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('amount, status'),
      supabase.from('projects').select('status, created_at'),
      supabase.from('profiles').select('role'),
      supabase.from('bids').select('created_at').order('created_at'),
    ]);

    const revenue = payments?.filter((p) => p.status === 'released').reduce((a, p) => a + Number(p.amount), 0) || 0;
    setData({ users: users || 0, projects: projects || 0, revenue, bids: bids || 0, milestones: milestones || 0, teams: teams || 0 });

    // Project status breakdown
    const statusCounts: Record<string, number> = {};
    allProjects?.forEach((p) => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
    setProjectStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace('_', ' '), value })));

    // Role breakdown
    const roleCounts: Record<string, number> = {};
    profiles?.forEach((p) => { roleCounts[p.role] = (roleCounts[p.role] || 0) + 1; });
    setRoleData(Object.entries(roleCounts).map(([name, value]) => ({ name, value })));

    // Monthly projects and bids
    const now = new Date();
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { month: months[d.getMonth()], year: d.getFullYear(), projects: 0, bids: 0 };
    });
    allProjects?.forEach((p) => {
      const d = new Date(p.created_at);
      const idx = last6.findIndex((l) => l.month === months[d.getMonth()] && l.year === d.getFullYear());
      if (idx >= 0) last6[idx].projects++;
    });
    recentBids?.forEach((b) => {
      const d = new Date(b.created_at);
      const idx = last6.findIndex((l) => l.month === months[d.getMonth()] && l.year === d.getFullYear());
      if (idx >= 0) last6[idx].bids++;
    });
    setMonthlyData(last6);

    // Top students
    const { data: students } = await supabase
      .from('profiles')
      .select('name, skill_score, avatar_url')
      .eq('role', 'student')
      .order('skill_score', { ascending: false })
      .limit(5);
    setTopStudents(students || []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRealtime([
    { table: 'projects', onData: fetchAll },
    { table: 'bids', onData: fetchAll },
    { table: 'profiles', onData: fetchAll },
  ], []);

  const statCards = [
    { title: 'Total Users', value: data.users, icon: Users, variant: 'primary' as const },
    { title: 'Projects', value: data.projects, icon: FolderOpen, variant: 'accent' as const },
    { title: 'Revenue', value: `$${data.revenue.toLocaleString()}`, icon: DollarSign, variant: 'warning' as const },
    { title: 'Total Bids', value: data.bids, icon: BarChart3, variant: 'default' as const },
    { title: 'Milestones', value: data.milestones, icon: CheckCircle, variant: 'accent' as const },
    { title: 'Teams', value: data.teams, icon: Users, variant: 'primary' as const },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform-wide performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((c) => <StatCard key={c.title} {...c} />)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Chart */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Projects & Bids (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="projects" name="Projects" fill={COLORS[0]} radius={[3, 3, 0, 0]} />
                <Bar dataKey="bids" name="Bids" fill={COLORS[1]} radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Pie */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {projectStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Roles Pie */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="value">
                  {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Students Leaderboard */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Top Students by Skill Score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No student data yet</p>
            ) : (
              <div className="divide-y divide-border">
                {topStudents.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-amber-400/20 text-amber-400' :
                      i === 1 ? 'bg-slate-400/20 text-slate-400' :
                      i === 2 ? 'bg-orange-400/20 text-orange-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-primary transition-all"
                          style={{ width: `${Math.min(100, (s.skill_score / Math.max(...topStudents.map((t) => t.skill_score || 1))) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground w-8 text-right">{s.skill_score}</span>
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
