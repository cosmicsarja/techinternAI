import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Zap, Users, TrendingUp, CheckCircle, AlertCircle, Send,
  ShieldCheck, Code2, Trophy, DollarSign, Sparkles, ArrowRight
} from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { sendNotification } from '@/lib/notifications';
import {
  recommendTeam,
  MatchResult,
  TeamRecommendation,
} from '@/lib/matching';
import { formatDistanceToNow } from 'date-fns';

export default function AIMatching() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, TeamRecommendation>>({});
  const [invitations, setInvitations] = useState<Set<string>>(new Set());
  const [creatingTeam, setCreatingTeam] = useState<string | null>(null);
  const [createdTeams, setCreatedTeams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile) return;

    // Fetch company's projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', profile.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    // Fetch all students
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('skill_score', { ascending: false });

    if (projectsData) setProjects(projectsData);
    if (studentsData) {
      setStudents(studentsData);

      // Generate recommendations for each project
      if (projectsData && projectsData.length > 0 && studentsData.length > 0) {
        const recs: Record<string, TeamRecommendation> = {};
        projectsData.forEach(project => {
          const recommendation = recommendTeam(studentsData, {
            id: project.id,
            title: project.title,
            description: project.description,
            tech_stack: project.tech_stack || [],
            budget: project.budget,
            status: project.status,
          });
          recs[project.id] = recommendation;
        });
        setRecommendations(recs);
      }
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useRealtime([{ table: 'projects', onData: fetchAll }, { table: 'profiles', onData: fetchAll }], [profile?.id]);

  const acceptAndCreateTeam = async (projectId: string) => {
    setCreatingTeam(projectId);
    try {
      const project = projects.find(p => p.id === projectId);
      const recommendation = recommendations[projectId];
      
      if (!project || !recommendation || recommendation.suggestedMembers.length === 0) {
        toast.error('Unable to create team. No recommended members found.');
        return;
      }

      // Get leader (first/highest score member)
      const leader = recommendation.suggestedMembers[0];
      const otherMembers = recommendation.suggestedMembers.slice(1);

      // Create team with project and leader
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          project_id: projectId,
          leader_id: leader.studentId,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add other members to team_members table
      if (otherMembers.length > 0) {
        const memberInserts = otherMembers.map(member => ({
          team_id: newTeam.id,
          user_id: member.studentId,
          role: member.role,
        }));

        const { error: memberError } = await supabase
          .from('team_members')
          .insert(memberInserts);

        if (memberError) throw memberError;
      }

      // Update project status to 'assigned'
      const { error: projectError } = await supabase
        .from('projects')
        .update({ status: 'assigned' })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Notify all team members
      const allMembers = recommendation.suggestedMembers;
      
      for (const member of allMembers) {
        const roleDisplay = member.role.replace('_', ' ');
        const isLeader = member.studentId === leader.studentId;
        
        await sendNotification(
          member.studentId,
          isLeader ? '🎉 You\'ve been selected as Team Lead!' : '🎉 Added to Project Team!',
          isLeader 
            ? `Congratulations! You're the team lead for "${project?.title}". Access the workspace and start building!`
            : `You've been auto-assigned as ${roleDisplay} on "${project?.title}" based on AI matching. Check your Won Projects!`,
          'success'
        );
      }

      setCreatedTeams(prev => new Set([...prev, projectId]));
      toast.success(`Team created successfully! Redirecting to workspace...`);

      // Redirect to workspace
      setTimeout(() => {
        navigate(`/dashboard/workspace?projectId=${projectId}`);
      }, 1500);
    } catch (err: any) {
      toast.error('Failed to create team: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingTeam(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-20 bg-muted/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-96 bg-muted/30 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">AI Talent Matching</h1>
            <p className="text-sm text-muted-foreground mt-1">Intelligently matched students to your projects based on skills, experience, and tech stack</p>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-bold text-lg">No Open Projects</h3>
          <p className="text-sm text-muted-foreground mt-2">Post a project to get AI-matched with top students</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map(project => {
            const recommendation = recommendations[project.id];

            return (
              <Card key={project.id} className="shadow-elevated border-none overflow-hidden">
                <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-amber-500/10 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {project.tech_stack?.slice(0, 4).map((tech: string) => (
                          <Badge key={tech} variant="outline" className="text-xs bg-primary/5 border-primary/20">
                            {tech}
                          </Badge>
                        ))}
                        {project.tech_stack?.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{project.tech_stack.length - 4}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Budget</p>
                        <p className="text-2xl font-black text-foreground">${Number(project.budget).toLocaleString()}</p>
                      </div>
                      {!createdTeams.has(project.id) && recommendation && recommendation.suggestedMembers.length > 0 && (
                        <Button
                          onClick={() => acceptAndCreateTeam(project.id)}
                          disabled={creatingTeam === project.id}
                          className="gradient-primary text-primary-foreground font-bold h-9 text-xs whitespace-nowrap"
                        >
                          {creatingTeam === project.id ? (
                            <>
                              Creating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 mr-2" />
                              Accept & Create Team
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </>
                          )}
                        </Button>
                      )}
                      {createdTeams.has(project.id) && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-500">Team Created</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {recommendation && recommendation.suggestedMembers.length > 0 ? (
                    <div className="space-y-6">
                      {/* Recommendation Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Overall Match</p>
                          <p className="text-2xl font-black text-emerald-500">{recommendation.overallScore}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Team Size</p>
                          <p className="text-2xl font-black text-emerald-500">{recommendation.suggestedMembers.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Est. Delivery</p>
                          <p className="text-2xl font-black text-emerald-500">
                            {Math.round((recommendation.overallScore / 100) * 30) + 7}d
                          </p>
                        </div>
                      </div>

                      {/* Suggested Team */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Users className="w-4 h-4" /> Recommended Team
                        </h3>
                        <div className="space-y-3">
                          {recommendation.suggestedMembers.map((member, idx) => {
                            const student = students.find(s => s.id === member.studentId);
                            const isLeader = idx === 0;

                            return (
                              <div
                                key={member.studentId}
                                className={`p-4 rounded-xl border transition-colors group ${
                                  isLeader 
                                    ? 'border-primary/30 bg-primary/5' 
                                    : 'border-border hover:border-primary/30'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-lg ${
                                      isLeader 
                                        ? 'gradient-primary text-primary-foreground' 
                                        : 'bg-muted text-muted-foreground'
                                    }`}>
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <p className="font-bold text-foreground">{member.name}</p>
                                        {isLeader && (
                                          <Badge className="bg-primary/20 text-primary text-[10px] font-bold">TEAM LEAD</Badge>
                                        )}
                                        {student?.skill_score >= 80 && (
                                          <ShieldCheck className="w-4 h-4 text-blue-500" title="High skill score" />
                                        )}
                                        {member.score >= 80 && (
                                          <CheckCircle className="w-4 h-4 text-emerald-500" title="Excellent match" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex-wrap">
                                        <span>Role: <span className="text-foreground capitalize">{member.role.replace('_', ' ')}</span></span>
                                        <span>•</span>
                                        <span>Match: <span className="text-emerald-500">{member.score}%</span></span>
                                        <span>•</span>
                                        <span>Level: <span className="text-primary capitalize">
                                          {student?.skill_score >= 75 ? 'Senior' : student?.skill_score >= 50 ? 'Mid' : 'Junior'}
                                        </span></span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Match Reasons */}
                      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Why This Team
                        </p>
                        <ul className="space-y-1.5">
                          {[
                            'Perfect tech stack alignment',
                            'High combined skill score',
                            'Balanced experience levels',
                            'Optimal team composition',
                          ].map((reason, i) => (
                            <li key={i} className="text-xs text-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">No strong matches found yet. More students are joining!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      {students.length > 0 && (
        <Card className="shadow-card border-none bg-gradient-to-r from-primary/10 to-amber-500/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">AI Matching Pool</p>
                <p className="text-3xl font-black text-foreground">{students.length} Talented Students</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Trophy className="w-5 h-5 text-amber-500" />
                <p className="text-muted-foreground">Our AI analyzed <strong className="text-foreground">{students.length}</strong> student profiles to find the best matches for your projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
