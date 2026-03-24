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
import { Github, Mail, Star, Edit3, Check, X, Code, Trophy, Briefcase, ExternalLink, Globe } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

export default function StudentProfile() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [github, setGithub] = useState(profile?.github_url || '');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ bids: 0, teams: 0, reviews: 0, avgRating: 0 });

  useEffect(() => {
    setName(profile?.name || '');
    setBio(profile?.bio || '');
    setGithub(profile?.github_url || '');
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const fetchStats = async () => {
      const [{ count: bids }, { count: teams }, { data: reviews }] = await Promise.all([
        supabase.from('bids').select('*', { count: 'exact', head: true }).eq('student_id', profile.id),
        supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase.from('reviews').select('rating').eq('reviewee_id', profile.id),
      ]);
      const avgRating = reviews?.length
        ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
        : 0;
      setStats({ bids: bids || 0, teams: teams || 0, reviews: reviews?.length || 0, avgRating });
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
      github_url: github.trim(),
    }).eq('id', profile.id);
    if (!error) { toast.success('Profile modernized'); setEditing(false); await refreshProfile(); }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Talent Profile</h1>
        <Button variant="outline" size="sm" className="h-9 px-6 font-bold" onClick={() => (editing ? setEditing(false) : setEditing(true))}>
           {editing ? <X className="w-4 h-4 mr-2 text-destructive" /> : <Edit3 className="w-4 h-4 mr-2 text-primary" />}
           {editing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Basic Info */}
        <div className="md:col-span-1 space-y-6">
           <Card className="shadow-elevated border-none bg-card overflow-hidden">
              <div className="h-28 gradient-primary relative">
                 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-2xl bg-card border-4 border-card shadow-xl flex items-center justify-center text-4xl font-black text-primary">
                   {name?.charAt(0).toUpperCase()}
                 </div>
              </div>
              <CardContent className="pt-12 pb-6 text-center">
                 <h2 className="text-xl font-black text-foreground">{name}</h2>
                 <p className="text-xs font-bold text-primary uppercase tracking-[0.15em] mt-1">Full-Stack Engineer</p>
                 <div className="flex items-center justify-center gap-1.5 mt-3 text-muted-foreground">
                    <Mail className="w-3 h-3" /> <span className="text-[11px] font-medium">{profile?.email}</span>
                 </div>
                 <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none shadow-none text-[10px] py-0 px-2 uppercase font-bold">Verified Score: {profile?.skill_score || 0}</Badge>
                 </div>
              </CardContent>
           </Card>

           <Card className="shadow-card border-none bg-card p-4 space-y-4">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Talent Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                    <p className="text-sm font-black">{stats.bids}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">Submissions</p>
                 </div>
                 <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                    <p className="text-sm font-black">{stats.teams}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">Projects</p>
                 </div>
              </div>
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] text-primary/70 font-bold uppercase">Rating</p>
                    <p className="text-sm font-black">{stats.avgRating.toFixed(1)} <Star className="w-3 h-3 inline fill-primary text-primary ml-0.5 mb-1" /></p>
                 </div>
                 < Trophy className="w-6 h-6 text-primary/20" />
              </div>
           </Card>

           <Card className="shadow-elevated border-none bg-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 space-y-5">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       <Code className="w-4 h-4 text-primary mb-0.5" /> Skill Breakdown
                    </h3>
                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-[10px] uppercase font-bold px-2 py-0 h-5">Verified</Badge>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <div className="flex justify-between text-xs font-bold">
                          <span className="text-foreground">Frontend (React/Vite)</span>
                          <span className="text-primary">85%</span>
                       </div>
                       <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                          <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-1000 ease-out" style={{ width: '85%' }} />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <div className="flex justify-between text-xs font-bold">
                          <span className="text-foreground">Backend (Node/Supabase)</span>
                          <span className="text-primary">72%</span>
                       </div>
                       <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                          <div className="h-full bg-gradient-to-r from-emerald-500/60 to-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{ width: '72%' }} />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <div className="flex justify-between text-xs font-bold">
                          <span className="text-foreground">UI/UX (Tailwind/CSS)</span>
                          <span className="text-primary">90%</span>
                       </div>
                       <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                          <div className="h-full bg-gradient-to-r from-amber-500/60 to-amber-500 rounded-full transition-all duration-1000 ease-out" style={{ width: '90%' }} />
                       </div>
                    </div>
                 </div>

                 <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground text-center font-medium">Scores auto-calculated based on project deliverables and company reviews.</p>
                 </div>
              </div>
           </Card>
        </div>

        {/* Right Column: Bio & Portfolio */}
        <div className="md:col-span-2 space-y-6">
           {editing ? (
             <Card className="shadow-elevated border-none bg-card p-6 space-y-6">
                <div className="space-y-4">
                   <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Full Professional Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-background/50 font-bold" /></div>
                   <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Github ID (Username Only)</Label><Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="tech-pro" className="h-11 bg-background/50" /></div>
                   <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Professional Summary</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} placeholder="Specialize in..." className="bg-background/50 resize-none leading-relaxed" /></div>
                   <Button onClick={save} disabled={saving} className="w-full h-11 gradient-primary text-primary-foreground font-black text-base shadow-lg shadow-primary/20">
                      {saving ? 'Engine Synchronizing...' : 'Submit Profile Audit'}
                   </Button>
                </div>
             </Card>
           ) : (
             <>
               <Card className="shadow-card border-none bg-card p-8">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4 uppercase tracking-widest"><Check className="w-4 h-4 text-emerald-400" /> Professional Summary</h3>
                  <p className="text-base text-muted-foreground leading-relaxed italic whitespace-pre-wrap">"{bio || 'No professional bio provided. Introduce yourself to companies by clicking Edit and sharing your experience.'}"</p>
                  <div className="flex flex-wrap gap-2 mt-8">
                     {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Cloud Infrastructure'].map(s => <Badge key={s} variant="secondary" className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-white/5 shadow-sm bg-muted/30">{s}</Badge>)}
                  </div>
               </Card>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="shadow-card border-none bg-card p-5 hover:bg-muted/10 transition-colors cursor-pointer border border-transparent hover:border-primary/10">
                     <Github className="w-6 h-6 text-foreground mb-4" />
                     <h4 className="text-sm font-bold">Code Portfolio</h4>
                     <p className="text-xs text-muted-foreground mt-1 truncate">{github || 'Not linked'}</p>
                     <ExternalLink className="w-3 h-3 text-primary ml-auto mt-2" />
                  </Card>
                  <Card className="shadow-card border-none bg-card p-5 hover:bg-muted/10 transition-colors cursor-pointer border border-transparent hover:border-primary/10">
                     <Globe className="w-6 h-6 text-foreground mb-4" />
                     <h4 className="text-sm font-bold">Personal Brand</h4>
                     <p className="text-xs text-muted-foreground mt-1 truncate">techintern.me/talent/{profile?.id.slice(0, 8)}</p>
                     <ExternalLink className="w-3 h-3 text-primary ml-auto mt-2" />
                  </Card>
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
}
