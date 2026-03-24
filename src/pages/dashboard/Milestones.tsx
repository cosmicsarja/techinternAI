import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, CheckCircle, XCircle, AlertCircle, Clock, Calendar, ChevronRight, Upload } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { sendNotification } from '@/lib/notifications';
import { formatDistanceToNow, isPast } from 'date-fns';

type MilestoneStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

const statusConfig: Record<MilestoneStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-slate-500/15 text-slate-400 border-slate-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: AlertCircle },
  submitted: { label: 'Submitted', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: Upload },
  approved: { label: 'Approved', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500/15 text-red-400 border-red-500/20', icon: XCircle },
};

function getProgress(milestones: any[]) {
  if (!milestones.length) return 0;
  const done = milestones.filter((m) => m.status === 'approved').length;
  return Math.round((done / milestones.length) * 100);
}

export default function Milestones() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<Record<string, any[]>>({});
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitLink, setSubmitLink] = useState('');
  const [submitDialogMs, setSubmitDialogMs] = useState<any | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!profile) return;
    let projs: any[] = [];
    if (profile.role === 'company') {
      const { data } = await supabase.from('projects').select('*').eq('company_id', profile.id).order('created_at', { ascending: false });
      projs = data || [];
    } else if (profile.role === 'admin') {
      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      projs = data || [];
    } else {
      // Student: leader of teams + member of teams
      const { data: leaderTeams } = await supabase.from('teams').select('project_id, projects(*)').eq('leader_id', profile.id);
      const { data: memberTeams } = await supabase
        .from('team_members')
        .select('teams!inner(project_id, projects(*))')
        .eq('user_id', profile.id);
      const seen = new Set<string>();
      const addProject = (p: any) => {
        if (p && !seen.has(p.id)) { seen.add(p.id); projs.push(p); }
      };
      leaderTeams?.forEach((t: any) => addProject(t.projects));
      memberTeams?.forEach((m: any) => addProject((m.teams as any)?.projects));
    }
    setProjects(projs);

    const ms: Record<string, any[]> = {};
    await Promise.all(
      projs.map(async (p) => {
        const { data } = await supabase
          .from('milestones')
          .select('*')
          .eq('project_id', p.id)
          .order('created_at');
        if (data) ms[p.id] = data;
      })
    );
    setMilestones(ms);
  }, [profile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useRealtime([
    { table: 'milestones', onData: () => fetchAll() },
  ], [profile?.id]);

  const addMilestone = async () => {
    if (!selectedProject || !newTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    const { error } = await supabase.from('milestones').insert({
      project_id: selectedProject,
      title: newTitle,
      description: newDesc,
      deadline: newDeadline || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Milestone added');
    setNewTitle(''); setNewDesc(''); setNewDeadline('');
    setDialogOpen(false);
    fetchAll();
  };

  const updateStatus = async (milestone: any, status: MilestoneStatus, extra?: { submission_link?: string }) => {
    setUpdating(milestone.id);
    const { error } = await supabase.from('milestones').update({ status }).eq('id', milestone.id);
    if (error) { toast.error(error.message); setUpdating(null); return; }

    // If submitted, also create/update deliverable
    if (status === 'submitted' && extra?.submission_link) {
      await supabase.from('deliverables').upsert({
        milestone_id: milestone.id,
        submission_link: extra.submission_link,
        status: 'submitted',
        submitted_by: profile?.id,
      });
    }

    // Notify relevant parties
    const project = projects.find((p) => p.id === milestone.project_id);
    if (status === 'submitted' && project) {
      await sendNotification(
        project.company_id,
        'Milestone Submitted',
        `Milestone "${milestone.title}" has been submitted for review on "${project.title}"`,
        'info'
      );
    }
    if ((status === 'approved' || status === 'rejected') && project) {
      // Notify team leader
      const { data: team } = await supabase.from('teams').select('leader_id').eq('project_id', project.id).single();
      if (team) {
        await sendNotification(
          team.leader_id,
          status === 'approved' ? '✅ Milestone Approved' : '❌ Milestone Rejected',
          `Milestone "${milestone.title}" on "${project.title}" was ${status}.`,
          status === 'approved' ? 'success' : 'warning'
        );
      }
    }

    toast.success(`Milestone ${status.replace('_', ' ')}`);
    setSubmitDialogMs(null);
    setSubmitLink('');
    setUpdating(null);
    fetchAll();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Milestones</h1>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CheckCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No projects with milestones</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Win a project to start tracking milestones</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const pMilestones = milestones[p.id] || [];
            const progress = getProgress(pMilestones);

            return (
              <Card key={p.id} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{p.title}</CardTitle>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Progress value={progress} className="h-1.5 flex-1 max-w-[180px]" />
                        <span className="text-xs text-muted-foreground">{progress}% complete</span>
                        <span className="text-xs text-muted-foreground">({pMilestones.filter((m) => m.status === 'approved').length}/{pMilestones.length} approved)</span>
                      </div>
                    </div>
                    {profile?.role !== 'company' && (
                      <Dialog open={dialogOpen && selectedProject === p.id}
                        onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            id={`add-milestone-${p.id}`}
                            onClick={() => { setSelectedProject(p.id); setDialogOpen(true); }}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Milestone
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>New Milestone for {p.title}</DialogTitle></DialogHeader>
                          <div className="space-y-3 pt-1">
                            <div className="space-y-2"><Label>Title *</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Frontend UI complete" /></div>
                            <div className="space-y-2"><Label>Description</Label><Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What needs to be done?" rows={3} /></div>
                            <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} /></div>
                            <Button onClick={addMilestone} className="w-full gradient-primary text-primary-foreground">Add Milestone</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!pMilestones.length ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">No milestones yet</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {pMilestones.map((m) => {
                        const { color, icon: Icon } = statusConfig[m.status as MilestoneStatus] || statusConfig.pending;
                        const overdue = m.deadline && isPast(new Date(m.deadline)) && m.status !== 'approved';
                        return (
                          <div key={m.id} className={`flex items-start gap-4 p-4 ${m.status === 'approved' ? 'opacity-60' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm font-medium ${m.status === 'approved' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{m.title}</p>
                                <Badge variant="secondary" className={`text-[10px] border ${color}`}>{statusConfig[m.status as MilestoneStatus]?.label || m.status}</Badge>
                              </div>
                              {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                              {m.deadline && (
                                <p className={`text-xs flex items-center gap-1 mt-1 ${overdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                                  <Calendar className="w-3 h-3" />
                                  {overdue ? '⚠ Overdue · ' : ''}
                                  {new Date(m.deadline).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Student: start / submit */}
                              {profile?.role === 'student' && m.status === 'pending' && (
                                <Button size="sm" variant="outline" disabled={!!updating}
                                  onClick={() => updateStatus(m, 'in_progress')}>
                                  Start
                                </Button>
                              )}
                              {profile?.role === 'student' && m.status === 'in_progress' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" className="gradient-primary text-primary-foreground"
                                      onClick={() => setSubmitDialogMs(m)}>
                                      <Upload className="w-3.5 h-3.5 mr-1" />Submit
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader><DialogTitle>Submit Milestone</DialogTitle></DialogHeader>
                                    <div className="space-y-3 pt-1">
                                      <p className="text-sm text-muted-foreground">Submitting: <span className="font-medium text-foreground">{m.title}</span></p>
                                      <div className="space-y-2">
                                        <Label>Submission Link (optional)</Label>
                                        <Input value={submitLink} onChange={(e) => setSubmitLink(e.target.value)} placeholder="https://github.com/..." />
                                      </div>
                                      <Button
                                        onClick={() => updateStatus(m, 'submitted', { submission_link: submitLink })}
                                        disabled={!!updating}
                                        className="w-full gradient-primary text-primary-foreground">
                                        {updating === m.id ? 'Submitting...' : 'Submit for Review'}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {/* Company: approve / reject */}
                              {profile?.role === 'company' && m.status === 'submitted' && (
                                <>
                                  <Button size="sm" className="gradient-primary text-primary-foreground"
                                    disabled={!!updating}
                                    onClick={() => updateStatus(m, 'approved')}>
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />{updating === m.id ? '...' : 'Approve'}
                                  </Button>
                                  <Button size="sm" variant="destructive" disabled={!!updating}
                                    onClick={() => updateStatus(m, 'rejected')}>
                                    <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
