import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Zap, TrendingUp, DollarSign, Code2, CheckCircle, AlertCircle,
  Building, Send, Sparkles, ArrowRight
} from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { sendNotification } from '@/lib/notifications';
import { matchStudentToProjects } from '@/lib/matching';
import { formatDistanceToNow } from 'date-fns';

export default function RecommendedProjects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [biddingOnId, setBiddingOnId] = useState<string | null>(null);
  const [proposal, setProposal] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [timeline, setTimeline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!profile) return;

    // Get all open projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*, profiles!projects_company_id_fkey(name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (projectsData) {
      setProjects(projectsData);

      // Match student to projects using AI
      const matchedProjects = matchStudentToProjects(profile, projectsData);
      
      // Enrich with project details
      const enrichedMatches = matchedProjects.map(match => {
        const project = projectsData.find(p => p.id === match.projectId);
        return {
          ...match,
          project,
        };
      });

      setMatches(enrichedMatches);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useRealtime([{ table: 'projects', onData: fetchAll }], [profile?.id]);

  const submitBid = async () => {
    if (!profile || !biddingOnId) return;
    if (!proposal.trim() || !bidAmount) {
      toast.error('Proposal and bid amount are required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('bids').insert({
        project_id: biddingOnId,
        student_id: profile.id,
        proposal,
        bid_amount: parseFloat(bidAmount),
        timeline,
      });

      if (error) throw error;

      const project = projects.find(p => p.id === biddingOnId);
      await sendNotification(
        project.company_id,
        '🎯 AI-Matched Student Bid!',
        `${profile.name} (AI matched ${matches.find(m => m.projectId === biddingOnId)?.compatibilityScore}% match) bid $${parseFloat(bidAmount).toLocaleString()} on "${project.title}"`,
        'info'
      );

      toast.success('Bid submitted! The company will review your AI-matched proposal.');
      setOpen(false);
      setProposal('');
      setBidAmount('');
      setTimeline('');
      setBiddingOnId(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-20 bg-muted/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted/30 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">AI Recommended Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">Projects matched to your skills, experience, and tech stack</p>
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-bold text-lg">No Matched Projects Yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Check back soon! More companies are posting projects.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const project = match.project;
            const matchScore = match.compatibilityScore;
            const isExcellent = matchScore >= 80;
            const isGood = matchScore >= 60;

            return (
              <Card
                key={project.id}
                className={`shadow-card border transition-all ${
                  isExcellent
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isGood
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-border'
                }`}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-foreground">{project.title}</h3>
                          {isExcellent && (
                            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px] font-bold uppercase">
                              <Sparkles className="w-3 h-3 mr-1" /> Perfect Match
                            </Badge>
                          )}
                          {isGood && !isExcellent && (
                            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] font-bold uppercase">
                              <CheckCircle className="w-3 h-3 mr-1" /> Good Match
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="w-4 h-4" />
                          <span className="font-medium">{project.profiles?.name}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-3xl font-black text-foreground">{matchScore}%</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase">Match Score</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Tech Stack & Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">
                          Tech Stack
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {project.tech_stack?.slice(0, 3).map((tech: string) => (
                            <Badge
                              key={tech}
                              variant="outline"
                              className="text-xs bg-primary/5 border-primary/20"
                            >
                              {tech}
                            </Badge>
                          ))}
                          {project.tech_stack?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.tech_stack.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">
                          <DollarSign className="w-3 h-3 inline mr-1" /> Budget
                        </p>
                        <p className="text-lg font-black text-foreground">
                          ${Number(project.budget).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">
                          Posted
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" /> Why Matched
                      </p>
                      <ul className="space-y-1">
                        {match.matchReasons.map((reason: string, idx: number) => (
                          <li key={idx} className="text-xs text-foreground/80 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Dialog open={open && biddingOnId === project.id} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="flex-1 gradient-primary text-primary-foreground font-bold h-10"
                            onClick={() => setBiddingOnId(project.id)}
                          >
                            <Send className="w-4 h-4 mr-2" /> Place Bid
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Place Bid on {project.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                              <p className="text-xs text-muted-foreground font-bold uppercase mb-1">AI Match Score</p>
                              <p className="text-2xl font-black text-primary">{matchScore}%</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="proposal">Your Proposal *</Label>
                              <Textarea
                                id="proposal"
                                value={proposal}
                                onChange={(e) => setProposal(e.target.value)}
                                placeholder="Explain your approach and why you're the best fit for this project..."
                                rows={5}
                                className="resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="bid-amount">Bid Amount *</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    $
                                  </span>
                                  <Input
                                    id="bid-amount"
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    placeholder="5000"
                                    className="pl-7"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="timeline">Timeline</Label>
                                <Input
                                  id="timeline"
                                  value={timeline}
                                  onChange={(e) => setTimeline(e.target.value)}
                                  placeholder="e.g. 2 weeks"
                                />
                              </div>
                            </div>

                            <Button
                              onClick={submitBid}
                              disabled={submitting}
                              className="w-full gradient-primary text-primary-foreground font-bold h-11"
                            >
                              {submitting ? 'Submitting...' : 'Submit Bid'}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" className="flex-1 font-semibold h-10" asChild>
                        <a href={`/dashboard/projects?search=${encodeURIComponent(project.title)}`}>
                          View Details
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer Stats */}
      {matches.length > 0 && (
        <Card className="shadow-card border-none bg-gradient-to-r from-emerald-500/10 to-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Your Match Quality
                </p>
                <p className="text-2xl font-black text-foreground">
                  {Math.round(matches.reduce((sum, m) => sum + m.compatibilityScore, 0) / matches.length)}% Average
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Code2 className="w-5 h-5 text-primary" />
                <p className="text-muted-foreground">
                  Our AI found <strong className="text-foreground">{matches.length} projects</strong> that align with your skills and experience
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
