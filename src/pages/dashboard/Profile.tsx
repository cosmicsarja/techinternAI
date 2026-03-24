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
import { Github, Mail, Star, Edit3, Check, X, Camera } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

export default function Profile() {
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

  useRealtime([
    { table: 'profiles', filter: `id=eq.${profile?.id}`, onData: () => refreshProfile() },
  ], [profile?.id]);

  const save = async () => {
    if (!profile) return;
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      name: name.trim(),
      bio: bio.trim(),
      github_url: github.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);
    if (error) { toast.error(error.message); }
    else {
      toast.success('Profile updated');
      await refreshProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  const cancel = () => {
    setName(profile?.name || '');
    setBio(profile?.bio || '');
    setGithub(profile?.github_url || '');
    setEditing(false);
  };

  const roleColor: Record<string, string> = {
    student: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    company: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    admin: 'bg-red-500/15 text-red-400 border-red-500/20',
  };

  return (
    <div className="max-w-2xl animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        {!editing && (
          <Button
            variant="outline"
            size="sm"
            id="edit-profile-btn"
            onClick={() => setEditing(true)}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />Edit
          </Button>
        )}
      </div>

      {/* Hero Card */}
      <Card className="shadow-card overflow-hidden">
        <div className="h-20 gradient-primary" />
        <CardContent className="pt-0 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl gradient-primary border-4 border-card flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
                {name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
            <Badge variant="secondary" className={`border text-xs capitalize ${roleColor[profile?.role || 'student']}`}>
              {profile?.role}
            </Badge>
          </div>
          <div>
            {editing ? (
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg font-bold h-9 mb-1"
                placeholder="Your name"
              />
            ) : (
              <h2 className="text-lg font-bold text-foreground">{profile?.name || 'Unnamed User'}</h2>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{profile?.email}</span>
            </div>
            {profile?.role === 'student' && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium text-foreground">{profile?.skill_score}</span>
                <span className="text-xs text-muted-foreground">skill score</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      {profile?.role === 'student' && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Bids', value: stats.bids },
            { label: 'Teams Joined', value: stats.teams },
            { label: 'Reviews', value: stats.reviews },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 rounded-xl bg-card border border-border">
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Edit Form */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {editing ? 'Edit Information' : 'About'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="profile-name-field">Name *</Label>
                <Input
                  id="profile-name-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-bio">Bio</Label>
                <Textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell others about yourself, your skills, and what you're looking for..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-github" className="flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" />GitHub URL
                </Label>
                <Input
                  id="profile-github"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/yourusername"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  id="save-profile-btn"
                  onClick={save}
                  disabled={saving || !name.trim()}
                  className="gradient-primary text-primary-foreground"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={cancel} disabled={saving}>
                  <X className="w-3.5 h-3.5 mr-1.5" />Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {profile?.bio ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No bio added yet. Click Edit to add one.</p>
              )}
              {profile?.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Github className="w-4 h-4" />
                  {profile.github_url.replace('https://github.com/', '@')}
                </a>
              )}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Member since {new Date((profile as any)?.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
