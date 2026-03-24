import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Star, MessageCircle, Plus } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { sendNotification } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(i)}
          className={`transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            className={`w-5 h-5 ${i <= (hover || value)
              ? 'text-amber-400 fill-amber-400'
              : 'text-muted-foreground/30'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedReviewee, setSelectedReviewee] = useState('');
  const [reviewees, setReviewees] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('reviews')
      .select('*, projects(title), reviewer:profiles!reviews_reviewer_id_fkey(name, avatar_url), reviewee:profiles!reviews_reviewee_id_fkey(name)')
      .order('created_at', { ascending: false });
    if (data) setReviews(data);
  }, [profile]);

  const fetchCompletedProjects = useCallback(async () => {
    if (!profile) return;
    // Fetch completed projects this user was involved in that they haven't reviewed yet
    let projectIds: string[] = [];
    if (profile.role === 'company') {
      const { data } = await supabase.from('projects').select('id, title').eq('company_id', profile.id).eq('status', 'completed');
      projectIds = data?.map((p) => p.id) || [];
      setCompletedProjects(data || []);
    } else {
      const { data: teams } = await supabase.from('teams').select('project_id, projects(id, title, status)').eq('leader_id', profile.id);
      const projs = teams?.filter((t: any) => t.projects?.status === 'completed').map((t: any) => t.projects) || [];
      setCompletedProjects(projs);
    }
  }, [profile]);

  useEffect(() => { fetchReviews(); fetchCompletedProjects(); }, [fetchReviews, fetchCompletedProjects]);

  useRealtime([{ table: 'reviews', onData: () => fetchReviews() }], [profile?.id]);

  // When a project is selected, load potential reviewees
  const onProjectSelect = async (projectId: string) => {
    setSelectedProject(projectId);
    setSelectedReviewee('');
    const { data: team } = await supabase
      .from('teams')
      .select('leader_id, team_members(user_id, profiles!team_members_user_id_fkey(id, name))')
      .eq('project_id', projectId)
      .single();

    if (!team) return;
    const candidates: any[] = [];
    // If company is reviewing: leader + members
    const { data: project } = await supabase.from('projects').select('company_id, profiles!projects_company_id_fkey(id, name)').eq('id', projectId).single();
    if (profile?.role === 'company') {
      // Reviewee = team leader
      const { data: leaderProfile } = await supabase.from('profiles').select('id, name').eq('id', team.leader_id).single();
      if (leaderProfile) candidates.push(leaderProfile);
      (team.team_members as any[])?.forEach((m: any) => {
        if (m.profiles && m.user_id !== team.leader_id) candidates.push(m.profiles);
      });
    } else {
      // Student reviewing: company
      if (project) candidates.push((project as any).profiles);
    }
    setReviewees(candidates.filter(Boolean));
  };

  const submitReview = async () => {
    if (!profile || !selectedProject || !feedback.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      project_id: selectedProject,
      reviewer_id: profile.id,
      reviewee_id: selectedReviewee || null,
      rating,
      feedback,
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }

    // Notify reviewee
    if (selectedReviewee) {
      await sendNotification(
        selectedReviewee,
        'New Review Received',
        `You received a ${rating}-star review: "${feedback.slice(0, 80)}..."`,
        'info'
      );
    }
    // Optionally bump skill_score if it's a good review
    if (selectedReviewee && rating >= 4) {
      await supabase.rpc('increment_skill_score' as any, { user_id: selectedReviewee, amount: rating - 2 }).catch(() => {});
    }

    toast.success('Review submitted!');
    setDialogOpen(false);
    setFeedback(''); setRating(5); setSelectedProject(''); setSelectedReviewee('');
    fetchReviews();
    setSubmitting(false);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          {avgRating && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={Math.round(Number(avgRating))} />
              <span className="text-sm text-muted-foreground">{avgRating} average ({reviews.length} reviews)</span>
            </div>
          )}
        </div>
        {completedProjects.length > 0 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground" id="write-review-btn">
                <Plus className="w-4 h-4 mr-1" />Write Review
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Write a Review</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select value={selectedProject} onValueChange={onProjectSelect}>
                    <SelectTrigger id="review-project"><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {completedProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {reviewees.length > 0 && (
                  <div className="space-y-2">
                    <Label>Reviewee</Label>
                    <Select value={selectedReviewee} onValueChange={setSelectedReviewee}>
                      <SelectTrigger id="review-reviewee"><SelectValue placeholder="Who are you reviewing?" /></SelectTrigger>
                      <SelectContent>
                        {reviewees.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Rating *</Label>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <div className="space-y-2">
                  <Label>Feedback *</Label>
                  <Textarea
                    id="review-feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your experience working on this project..."
                    rows={4}
                  />
                </div>
                <Button
                  id="submit-review-btn"
                  onClick={submitReview}
                  disabled={submitting || !selectedProject || !feedback.trim()}
                  className="w-full gradient-primary text-primary-foreground"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <MessageCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No reviews yet</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Complete a project to leave and receive reviews</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                    {r.reviewer?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{r.reviewer?.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">
                          on <span className="text-foreground">{r.projects?.title}</span>
                          {r.reviewee && <> → <span className="text-foreground">{r.reviewee.name}</span></>}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StarRating value={r.rating} />
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {r.feedback && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{r.feedback}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
