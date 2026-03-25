import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, Star, Edit3, Check, X, Building, Globe, ShieldCheck, Briefcase, Zap, Settings as SettingsIcon } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

export default function CompanyProfile() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [website, setWebsite] = useState(profile?.github_url || ''); // Reusing field for simplicity as industry project
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ projects: 0, activeTeams: 0, totalPaid: 0 });

  useEffect(() => {
    setName(profile?.name || '');
    setBio(profile?.bio || '');
    setWebsite(profile?.github_url || '');
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const fetchStats = async () => {
      const [{ count: projs }, { count: activeTeams }, { data: payments }] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', profile.id),
        supabase.from('teams').select('*, projects!inner(*)').eq('projects.company_id', profile.id),
        supabase.from('payments').select('amount').eq('payer_id', profile.id).eq('status', 'released'),
      ]);
      const totalPaid = payments?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      setStats({ projects: projs || 0, activeTeams: activeTeams || 0, totalPaid });
    };
    fetchStats();
  }, [profile]);

  useRealtime([{ table: 'profiles', filter: `id=eq.${profile?.id}`, onData: () => refreshProfile() }], [profile?.id]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      name: name.trim(),
      bio: bio.trim(),
      github_url: website.trim(),
    }).eq('id', profile.id);
    if (!error) { toast.success('Entity profile updated'); setEditing(false); await refreshProfile(); }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                <Building className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Institutional Profile</h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Enterprise Talent Solutions Dashboard</p>
             </div>
         </div>
         <Button variant="outline" size="sm" className="h-10 px-6 font-bold" onClick={() => (editing ? setEditing(false) : setEditing(true))}>
            {editing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
            {editing ? 'Exit Editor' : 'Modify Entity'}
         </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         {/* Left Info Column */}
         <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-elevated border-none bg-card overflow-hidden">
               <div className="h-32 bg-slate-900 relative">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                  <div className="absolute -bottom-10 left-8 w-24 h-24 rounded-3xl bg-card border-[6px] border-card shadow-2xl flex items-center justify-center text-4xl font-black text-foreground">
                    {name?.charAt(0).toUpperCase()}
                  </div>
               </div>
               <CardContent className="pt-14 pb-8 px-8">
                  <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">{name} <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-500/10" /></h2>
                  <p className="text-sm font-bold text-muted-foreground italic mb-6">Trusted Technology Partner</p>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground group cursor-pointer hover:text-primary transition-colors">
                        <Mail className="w-4 h-4" /> <span>{profile?.email}</span>
                     </div>
                     <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground group cursor-pointer hover:text-primary transition-colors">
                        <Globe className="w-4 h-4" /> <span>{website || 'entity.domain'}</span>
                     </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-border space-y-2">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Investment Volume</p>
                     <p className="text-3xl font-black text-foreground tracking-tighter">₹{stats.totalPaid.toLocaleString()}</p>
                     <p className="text-[10px] font-bold text-emerald-500 uppercase">Released to Talent Network</p>
                  </div>
               </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
               <Card className="shadow-card border-none bg-card p-5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Initiatives</p>
                  <p className="text-2xl font-black text-foreground tracking-tighter">{stats.projects}</p>
               </Card>
               <Card className="shadow-card border-none bg-card p-5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Teams</p>
                  <p className="text-2xl font-black text-foreground tracking-tighter">{stats.activeTeams}</p>
               </Card>
            </div>
         </div>

         {/* Main Content Column */}
         <div className="lg:col-span-8 space-y-6">
            {editing ? (
               <Card className="shadow-elevated border-none bg-card p-8 space-y-8 animate-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Entity Legal Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-background/50 font-bold border-none ring-1 ring-border focus-visible:ring-primary" /></div>
                        <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Corporate Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://entity.io" className="h-12 bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary" /></div>
                     </div>
                     <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Official Description</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={7} placeholder="Describe your corporate mission, technology requirements..." className="bg-background/50 resize-none leading-relaxed border-none ring-1 ring-border focus-visible:ring-primary" /></div>
                  </div>
                  <Button onClick={save} disabled={saving} className="w-full h-12 gradient-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/30 uppercase tracking-widest">
                     {saving ? 'Engine Publishing...' : 'Finalize Legal Profile'}
                  </Button>
               </Card>
            ) : (
               <div className="space-y-6">
                  <Card className="shadow-card border-none bg-card p-10 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                        <Zap className="w-40 h-40" />
                     </div>
                     <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-6 uppercase tracking-widest"><SettingsIcon className="w-4 h-4 text-primary" /> Entity Intelligence</h3>
                     <p className="text-xl font-medium text-foreground leading-relaxed italic whitespace-pre-wrap">"{bio || 'Our entity specializes in providing innovative solutions across multiple technological sectors. We partner with elite student talent to solve high-impact challenges.'}"</p>
                     
                     <div className="mt-12 flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 px-4 py-2 rounded-xl border border-white/5 uppercase tracking-widest">Industry: <span className="text-foreground">SaaS Technology</span></div>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 px-4 py-2 rounded-xl border border-white/5 uppercase tracking-widest">Hiring Status: <span className="text-emerald-500">Active</span></div>
                     </div>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Card className="shadow-card border-none bg-card p-6 flex flex-col gap-4 border-l-4 border-l-primary/30">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Recent Initiative</h4>
                        <div className="h-20 bg-muted/20 rounded-xl animate-pulse" />
                        <p className="text-[10px] text-muted-foreground italic font-medium">Automatic project logging enabled.</p>
                     </Card>
                     <Card className="shadow-card border-none bg-card p-6 flex flex-col gap-4 border-l-4 border-l-amber-500/30">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Safety & Escrow</h4>
                        <div className="flex items-center gap-3 text-emerald-500 text-xs font-bold uppercase py-2">
                           <ShieldCheck className="w-5 h-5" /> All Funds Secured
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-auto">Powered by Code Connect Hub Escrow v2.4</p>
                     </Card>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
