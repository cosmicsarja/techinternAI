import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import StatCard from '@/components/StatCard';
import {
  FolderOpen, FileText, DollarSign, Users, Trophy,
  BarChart3, TrendingUp, Clock, Activity, Zap, CheckCircle2, AlertCircle,
  Briefcase, ArrowRight, MessageSquare, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const statusColor: Record<string, string> = {
  open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  assigned: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  completed: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ bids: 0, teams: 0, earnings: 0, reputation: 0 });
  const [recommendedProjects, setRecommendedProjects] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile) return;
    
    // 1. Stats
    const [{ count: bids }, { count: teams }, { data: pays }, { data: reviews }] = await Promise.all([
      supabase.from('bids').select('*', { count: 'exact', head: true }).eq('student_id', profile.id),
      supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('payments').select('amount').eq('recipient_id', profile.id).eq('status', 'released'),
      supabase.from('reviews').select('rating').eq('reviewee_id', profile.id),
    ]);

    // Handle undefined payments if migration hasn't run yet
    const earnings = (pays || []).reduce((a, b) => a + Number(b.amount), 0);
    const avgRating = reviews?.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

    setStats({
      bids: bids || 0,
      teams: teams || 0,
      earnings,
      reputation: profile.skill_score || (avgRating * 20),
    });

    // 2. Recommended (Newest open projects)
    const { data: projs } = await supabase.from('projects').select('*, profiles!projects_company_id_fkey(name)').eq('status', 'open').order('created_at', { ascending: false }).limit(4);
    setRecommendedProjects(projs || []);

    // 3. Activity (Recent bids and milestone updates)
    const { data: recentBids } = await supabase.from('bids').select('*, projects(title)').eq('student_id', profile.id).order('created_at', { ascending: false }).limit(3);
    setActivity(recentBids || []);
    
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRealtime([{ table: 'bids', onData: fetchAll }, { table: 'projects', onData: fetchAll }], [profile?.id]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Hero Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-card border border-border shadow-elevated relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] select-none pointer-events-none">
           <Trophy className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
           <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-3xl font-black text-primary-foreground shadow-lg">
             {profile?.name?.charAt(0).toUpperCase()}
           </div>
           <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">System Ready, {profile?.name || 'Engineer'}.</h1>
              <p className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Status: Available for High-Impact Projects
              </p>
           </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
           <Button className="h-11 px-6 gradient-primary text-primary-foreground font-bold shadow-lg" asChild>
              <Link to="/dashboard/projects">Explore Opportunities</Link>
           </Button>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Bids', value: stats.bids, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Project Participation', value: stats.teams, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Total Revenue', value: `$${stats.earnings.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Talent Score', value: stats.reputation, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((s) => (
          <Card key={s.label} className="border-none shadow-card hover:translate-y-[-2px] transition-all">
            <CardContent className="p-6 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-2xl font-black text-foreground">{s.value}</p>
               </div>
               <div className={`p-3 rounded-xl ${s.bg} border border-white/5`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recommended for you */}
        <Card className="lg:col-span-8 shadow-card border-none bg-card overflow-hidden">
           <CardHeader className="p-6 border-b border-border bg-muted/10 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <Briefcase className="w-4 h-4 text-primary" /> Curated Opportunities
              </CardTitle>
              <Link to="/dashboard/projects" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></Link>
           </CardHeader>
           <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recommendedProjects.map(p => (
                  <div key={p.id} className="p-6 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <h4 className="text-base font-bold text-foreground truncate">{p.title}</h4>
                           <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 text-emerald-500 border-emerald-500/20 bg-emerald-500/5 uppercase font-bold tracking-widest">New</Badge>
                        </div>
                        <div className="flex items-center gap-5 text-xs text-muted-foreground font-medium">
                           <span>{p.profiles?.name}</span>
                           <span>•</span>
                           <span className="font-bold text-foreground">${Number(p.budget).toLocaleString()}</span>
                           <span>•</span>
                           <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                        </div>
                     </div>
                     <Button size="sm" variant="outline" className="h-9 px-4 font-bold rounded-xl border-white/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all" asChild>
                        <Link to="/dashboard/projects">Review Brief</Link>
                     </Button>
                  </div>
                ))}
              </div>
           </CardContent>
        </Card>

        {/* Recent Pipeline */}
        <Card className="lg:col-span-4 shadow-card border-none bg-card overflow-hidden">
           <CardHeader className="p-6 border-b border-border bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                 <Activity className="w-4 h-4 text-primary" /> Personal Pipeline
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6">
              <div className="space-y-6">
                 {activity.length === 0 ? (
                    <div className="text-center py-10 opacity-20"><Activity className="w-12 h-12 mx-auto mb-2" /><p className="text-[10px] font-bold uppercase">No recent pulses</p></div>
                 ) : (
                    activity.map(a => (
                      <div key={a.id} className="flex gap-4 group">
                         <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${a.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                         <div className="flex-1 min-w-0 border-b border-border/50 pb-4 group-last:border-none">
                            <p className="text-xs font-bold text-foreground truncate">{a.projects?.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                               <span className="font-bold uppercase tracking-widest">Bid: ${Number(a.bid_amount).toLocaleString()}</span>
                               <span>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                            </p>
                            <Badge className={`mt-2 text-[9px] py-0 border ${a.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                               Proposal {a.status}
                            </Badge>
                         </div>
                      </div>
                    ))
                 )}
              </div>
              <div className="mt-8 p-4 rounded-2xl bg-muted/30 border border-border">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Career Path
                 </p>
                 <p className="text-xs font-medium text-foreground leading-relaxed italic">"Keep applying to projects that match your tech stack to level up your Talent Score."</p>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
