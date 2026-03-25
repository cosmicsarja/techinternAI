import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Shield, Server, Users, DollarSign, Briefcase,
  TrendingUp, Activity, Zap, CheckCircle2, History,
  Lock, Globe, Search, MoreVertical, Terminal as TerminalIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ users: 0, projects: 0, revenue: 0, escrow: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!profile) return;
    const [
      { count: users },
      { count: projects },
      { data: released },
      { data: escrow }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('amount').eq('status', 'released'),
      supabase.from('payments').select('amount').eq('status', 'escrow'),
    ]);

    setStats({
      users: users || 0,
      projects: projects || 0,
      revenue: released?.reduce((a, p) => a + Number(p.amount), 0) || 0,
      escrow: escrow?.reduce((a, p) => a + Number(p.amount), 0) || 0,
    });

    // Mock logs for admin demo (In real app, fetch from audit_logs table)
    setRecentLogs([
      { id: 1, event: 'New Entity Onboarding', user: 'System', time: new Date().toISOString() },
      { id: 2, event: 'Escrow Released #492', user: 'Auth Engine', time: new Date(Date.now() - 3600000).toISOString() },
      { id: 3, event: 'Team Formed - Project Alpha', user: 'Contractor', time: new Date(Date.now() - 7200000).toISOString() },
    ]);
    
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useRealtime([{ table: 'profiles', onData: fetchStats }, { table: 'projects', onData: fetchStats }], [profile?.id]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Admin Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 shadow-2xl">
              <Shield className="w-7 h-7 text-primary" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Control Center</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Core Infrastructure v4.1 — Root Access
              </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-10 px-6 font-bold text-xs uppercase tracking-widest bg-card border-border"><TerminalIcon className="w-4 h-4 mr-2" /> System Logs</Button>
           <Button className="h-10 px-6 gradient-primary text-primary-foreground font-black text-xs uppercase tracking-widest"><Search className="w-4 h-4 mr-2" /> Audit Search</Button>
        </div>
      </div>

      {/* Global Ledger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Network Nodes', value: stats.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Deployed Projects', value: stats.projects, icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Processed Volume', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Secured Escrow', value: `₹${stats.escrow.toLocaleString()}`, icon: Lock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((s) => (
          <Card key={s.label} className="border-none shadow-card hover:bg-slate-900/40 transition-all border-l-4 border-l-primary/30">
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
         {/* Infrastructure Monitoring */}
         <Card className="lg:col-span-2 shadow-card border-none bg-card overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/10 flex items-center justify-between">
               <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" /> Service Health Monitor
               </CardTitle>
               <div className="flex items-center gap-4">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] uppercase font-bold">API: 99.9%</Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] uppercase font-bold">DB: Sync</Badge>
               </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Network Expansion</p>
                     <div className="h-32 w-full bg-slate-900/50 rounded-3xl border border-white/5 flex items-center justify-center overflow-hidden">
                        <TrendingUp className="w-16 h-16 text-primary opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-40" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Resource Allocation</p>
                     <div className="space-y-3">
                        {['Storage Usage', 'CPU Threads', 'Memory Mesh'].map((label, i) => (
                           <div key={label} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground"><span>{label}</span><span>{80 - i*15}%</span></div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${80 - i*15}%` }} /></div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
               
               <div className="p-6 rounded-3xl bg-muted/30 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Globe className="w-8 h-8 text-primary opacity-50" />
                     <div>
                        <p className="text-xs font-bold">Global Data Distribution</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">US-East (Primary) • EU-West (Failover)</p>
                     </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-white/10">Configure</Button>
               </div>
            </CardContent>
         </Card>

         {/* Kernel Audit Log */}
         <Card className="shadow-card border-none bg-card overflow-hidden flex flex-col">
            <CardHeader className="p-6 border-b border-border bg-muted/10">
               <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> Kernel Audit Log
               </CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] p-6 space-y-5">
               {recentLogs.map(log => (
                 <div key={log.id} className="group border-b border-white/5 pb-4 last:border-none">
                    <div className="flex items-center justify-between mb-1.5">
                       <span className="text-primary font-bold">[{log.user}]</span>
                       <span className="text-muted-foreground opacity-50">{formatDistanceToNow(new Date(log.time), { addSuffix: true })}</span>
                    </div>
                    <p className="text-foreground leading-relaxed uppercase tracking-tighter">{log.event}</p>
                 </div>
               ))}
               <div className="mt-8 p-4 bg-slate-900 border border-white/5 rounded-xl text-emerald-500/80 leading-relaxed italic">
                  $ tail -f /var/log/system.audit<br />
                  {'>'} Ready for next operation...
               </div>
            </div>
            <div className="p-4 bg-muted/20 border-t border-border mt-auto">
               <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">View Full Master Registry</Button>
            </div>
         </Card>
      </div>
    </div>
  );
}
