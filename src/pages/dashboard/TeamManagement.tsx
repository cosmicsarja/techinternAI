import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Crown, Users, Trash2 } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { sendNotification } from '@/lib/notifications';

const MEMBER_ROLES = ['developer', 'designer', 'tester', 'devops', 'pm', 'analyst'];

export default function TeamManagement() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<Record<string, any[]>>({});
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('developer');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('teams')
      .select('*, projects(id, title, status)')
      .eq('leader_id', profile.id);
    if (data) {
      setTeams(data);
      const mems: Record<string, any[]> = {};
      await Promise.all(
        data.map(async (t) => {
          const { data: m } = await supabase
            .from('team_members')
            .select('*, profiles!team_members_user_id_fkey(name, email, skill_score, avatar_url)')
            .eq('team_id', t.id);
          if (m) mems[t.id] = m;
        })
      );
      setMembers(mems);
    }
  }, [profile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useRealtime([
    { table: 'team_members', onData: () => fetchAll() },
    { table: 'teams', onData: () => fetchAll() },
  ], [profile?.id]);

  const addMember = async () => {
    if (!selectedTeam || !addEmail.trim()) return;
    setAdding(true);
    const { data: user } = await supabase.from('profiles').select('id, name').eq('email', addEmail.trim()).single();
    if (!user) { toast.error('No user found with that email'); setAdding(false); return; }

    // Check not already a member
    const existing = (members[selectedTeam] || []).find((m) => m.user_id === user.id);
    if (existing) { toast.error('User is already in this team'); setAdding(false); return; }

    const { error } = await supabase.from('team_members').insert({
      team_id: selectedTeam,
      user_id: user.id,
      role: addRole,
    });
    if (error) { toast.error(error.message); setAdding(false); return; }

    // Notify the new member
    const team = teams.find((t) => t.id === selectedTeam);
    await sendNotification(
      user.id,
      'Added to a Team!',
      `You've been added as ${addRole} on project "${team?.projects?.title}"`,
      'success'
    );

    toast.success(`${user.name} added as ${addRole}`);
    setAddEmail('');
    setDialogOpen(false);
    fetchAll();
    setAdding(false);
  };

  const removeMember = async (memberId: string, userId: string, teamId: string) => {
    await supabase.from('team_members').delete().eq('id', memberId);
    const team = teams.find((t) => t.id === teamId);
    await sendNotification(userId, 'Removed from Team', `You have been removed from "${team?.projects?.title}"`, 'warning');
    toast.success('Member removed');
    fetchAll();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Team Management</h1>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No teams yet</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Win a project bid to become a team leader</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((t) => {
            const teamMembers = members[t.id] || [];
            return (
              <Card key={t.id} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <CardTitle className="text-base">{t.projects?.title}</CardTitle>
                      {t.projects?.status && (
                        <Badge variant="secondary" className="text-[10px]">{t.projects.status.replace('_', ' ')}</Badge>
                      )}
                    </div>
                    <Dialog
                      open={dialogOpen && selectedTeam === t.id}
                      onOpenChange={(o) => { if (!o) setDialogOpen(false); }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          id={`add-member-${t.id}`}
                          onClick={() => { setSelectedTeam(t.id); setDialogOpen(true); }}
                        >
                          <UserPlus className="w-4 h-4 mr-1" /> Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-1">
                          <div className="space-y-2">
                            <Label htmlFor="member-email">Member Email *</Label>
                            <Input
                              id="member-email"
                              value={addEmail}
                              onChange={(e) => setAddEmail(e.target.value)}
                              placeholder="student@example.com"
                              type="email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={addRole} onValueChange={setAddRole}>
                              <SelectTrigger id="member-role"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {MEMBER_ROLES.map((r) => (
                                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            id="confirm-add-member"
                            onClick={addMember}
                            disabled={adding || !addEmail.trim()}
                            className="w-full gradient-primary text-primary-foreground"
                          >
                            {adding ? 'Adding...' : 'Add Member'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} · You are the leader
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  {!teamMembers.length ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">No members yet — add your first team member</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {teamMembers.map((m) => (
                        <div key={m.id} className="flex items-center justify-between px-4 py-3 group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                              {m.profiles?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{m.profiles?.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{m.profiles?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground hidden sm:block">Score: {m.profiles?.skill_score ?? '—'}</span>
                            <Badge variant="outline" className="capitalize text-[10px]">{m.role}</Badge>
                            <button
                              onClick={() => removeMember(m.id, m.user_id, t.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-muted-foreground hover:text-destructive"
                              title="Remove member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
