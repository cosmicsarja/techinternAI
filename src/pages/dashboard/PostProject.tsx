import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Sparkles } from 'lucide-react';
import { sendNotification } from '@/lib/notifications';

const COMMON_TECH = ['React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'MongoDB', 'Next.js', 'Vue.js', 'Docker', 'AWS', 'FastAPI', 'GraphQL'];

export default function PostProject() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addTech = (tech: string) => {
    const trimmed = tech.trim();
    if (!trimmed || techStack.includes(trimmed)) return;
    setTechStack((prev) => [...prev, trimmed]);
    setTechInput('');
  };

  const removeTech = (tech: string) => setTechStack((prev) => prev.filter((t) => t !== tech));

  const handleTechKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTech(techInput);
    }
  };

  const submit = async () => {
    if (!profile) return;
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
      toast.error('Please enter a valid budget');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from('projects').insert({
      title: title.trim(),
      description: description.trim(),
      tech_stack: techStack,
      budget: parseFloat(budget),
      deadline: deadline || null,
      company_id: profile.id,
    }).select().single();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Project posted! Students can now bid on it.');
      // Notify all students about new project (optional — skip if too noisy)
      navigate('/dashboard/select-leader');
    }
    setSubmitting(false);
  };

  const isValid = title.trim() && budget && !isNaN(parseFloat(budget)) && parseFloat(budget) > 0;

  return (
    <div className="max-w-2xl animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Post New Project</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Fill in the details below to find the perfect student team</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="project-title">Project Title *</Label>
            <Input
              id="project-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. E-commerce Platform with AI Recommendations"
              className="text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe the project requirements, goals, deliverables, and any specific skills needed..."
            />
            <p className="text-xs text-muted-foreground">{description.length}/2000 characters</p>
          </div>

          {/* Tech Stack */}
          <div className="space-y-2">
            <Label htmlFor="tech-input">Tech Stack</Label>
            <div className="flex gap-2">
              <Input
                id="tech-input"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={handleTechKeyDown}
                placeholder="Type and press Enter to add..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTech(techInput)}
                disabled={!techInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {/* Quick add common technologies */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_TECH.filter((t) => !techStack.includes(t)).slice(0, 8).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTech(t)}
                  className="text-[10px] px-2 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  + {t}
                </button>
              ))}
            </div>
            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {techStack.map((t) => (
                  <Badge key={t} variant="secondary" className="pl-2 pr-1 py-0.5 text-xs">
                    {t}
                    <button
                      onClick={() => removeTech(t)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Budget & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-budget">Budget ($) *</Label>
              <Input
                id="project-budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="5000"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-deadline">Deadline</Label>
              <Input
                id="project-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Preview summary */}
          {isValid && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <div className="flex items-center gap-2 text-primary mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-medium text-xs">Project Preview</span>
              </div>
              <p className="font-medium text-foreground">{title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>Budget: <span className="text-foreground font-medium">${parseFloat(budget).toLocaleString()}</span></span>
                {deadline && <span>Due: <span className="text-foreground">{new Date(deadline).toLocaleDateString()}</span></span>}
                {techStack.length > 0 && <span>{techStack.length} tech{techStack.length > 1 ? 's' : ''}</span>}
              </div>
            </div>
          )}

          <Button
            id="post-project-btn"
            onClick={submit}
            disabled={submitting || !isValid}
            className="w-full gradient-primary text-primary-foreground h-10"
          >
            {submitting ? 'Posting...' : 'Post Project'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
