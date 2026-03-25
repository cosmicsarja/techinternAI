import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  FolderOpen, FileText, DollarSign, Users, Briefcase,
  TrendingUp, Clock, Activity, Zap, CheckCircle2, AlertCircle,
  Plus, MessageSquare, ArrowRight, ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealtime } from '@/hooks/useRealtime';
import { DummyStudentSeeder } from '@/components/DummyStudentSeeder';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const statusColor: Record<string, string> = {
  open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  assigned: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  completed: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

export default function CompanyDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ active: 0, pendingBids: 0, totalSpend: 0, completed: 0 });
  const [ownedProjects, setOwnedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile) return;
    
    // 1. Stats and Projects
    const [
      { data: projs },
      { data: payments }
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('company_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('amount').eq('payer_id', profile.id).eq('status', 'released'),
    ]);

    if (projs) {
      setOwnedProjects(projs);
      const active = projs.filter(p => p.status === 'in_progress' || p.status === 'assigned').length;
      const completed = projs.filter(p => p.status === 'completed').length;
      
      // Get pending bids count for all company projects
      const { count: bidsCount } = await supabase.from('bids').select('*', { count: 'exact', head: true }).in('project_id', projs.map(p => p.id)).eq('status', 'pending');
      
      setStats({
        active,
        completed,
        pendingBids: bidsCount || 0,
        totalSpend: payments?.reduce((a, b) => a + Number(b.amount), 0) || 0,
      });
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRealtime([{ table: 'projects', onData: fetchAll }, { table: 'bids', onData: fetchAll }], [profile?.id]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-foreground tracking-tight italic uppercase">Executive Overview</h1>
           <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-1">Entity: {profile?.name}</p>
        </div>
        <Button className="gradient-primary text-primary-foreground font-black px-8 h-12 shadow-xl shadow-primary/20" asChild>
           <Link to="/dashboard/post-project"><Plus className="w-5 h-5 mr-2" /> Launch New Initiative</Link>
        </Button>
      </div>

      {/* Corporate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Live Initiatives', value: stats.active, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Pending Proposals', value: stats.pendingBids, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Net Investment', value: `₹${stats.totalSpend.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Success Rate', value: '100%', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((s) => (
          <Card key={s.label} className="border-none shadow-card hover:bg-muted/5 transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-2xl font-black text-foreground">{s.value}</p>
               </div>
               <div className={`p-3 rounded-2xl ${s.bg} border border-white/5`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Portfolio View */}
         <Card className="lg:col-span-2 shadow-card border-none bg-card overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/10 flex flex-row items-center justify-between">
               <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Active Portfolio
               </CardTitle>
               <Link to="/dashboard/active-projects" className="text-[10px] font-black uppercase text-primary hover:underline">Full Audit</Link>
            </CardHeader>
            <CardContent className="p-0">
               {ownedProjects.length === 0 ? (
                 <div className="p-20 text-center opacity-30">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-[10px] font-bold uppercase">No active instances</p>
                 </div>
               ) : (
                 <div className="divide-y divide-border">
                    {ownedProjects.slice(0, 5).map(p => (
                      <div key={p.id} className="p-6 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                               <h4 className="text-base font-bold text-foreground truncate">{p.title}</h4>
                               <Badge variant="outline" className={`text-[9px] font-black uppercase border ${statusColor[p.status]}`}>{p.status}</Badge>
                            </div>
                            <div className="flex items-center gap-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                               <span>Budget: ₹{Number(p.budget).toLocaleString()}</span>
                               <span>•</span>
                               <span>Initialized {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                            </div>
                         </div>
                         <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl border border-border group-hover:bg-primary group-hover:text-primary-foreground transition-all" asChild>
                            <Link to="/dashboard/active-projects"><ArrowRight className="w-4 h-4" /></Link>
                         </Button>
                      </div>
                    ))}
                 </div>
               )}
            </CardContent>
         </Card>

         {/* Intelligence Feed */}
         <Card className="shadow-card border-none bg-card overflow-hidden flex flex-col">
            <CardHeader className="p-6 border-b border-border bg-muted/10">
               <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Intelligence Feed</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between gap-8">
               <div className="space-y-6">
                  <div className="flex gap-4">
                     <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                     <div>
                        <p className="text-xs font-bold text-foreground leading-none">Market Dynamics</p>
                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed italic">"Student talent availability is up 12% this week for React/Node.js stacks."</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                     <div>
                        <p className="text-xs font-bold text-foreground leading-none">Payment Infrastructure</p>
                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed italic">"Escrow protection active on all 2024 initiatives."</p>
                     </div>
                  </div>
               </div>

               <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="w-16 h-16" /></div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Pro Tip</p>
                  <p className="text-xs font-medium text-foreground leading-relaxed">Selecting a Project Leader with a Skill Score {'>'} 80 reduces delivery time by 15%.</p>
               </div>
                <DummyStudentSeeder />
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
