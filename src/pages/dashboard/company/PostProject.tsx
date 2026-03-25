import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Sparkles, CheckCircle, ArrowRight, Briefcase, Code, DollarSign, Calendar } from 'lucide-react';

const COMMON_TECH = ['React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'MongoDB', 'Next.js', 'AWS', 'Docker', 'GraphQL', 'TailwindCSS', 'Firebase'];

export default function PostProject() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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

  const submit = async () => {
    if (!profile) return;
    setSubmitting(true);
    const { error } = await supabase.from('projects').insert({
      title: title.trim(),
      description: description.trim(),
      tech_stack: techStack,
      budget: parseFloat(budget),
      deadline: deadline || null,
      company_id: profile.id,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Project published successfully!');
      navigate('/dashboard/projects');
    }
    setSubmitting(false);
  };

  const isStep1Valid = title.trim().length > 5 && description.trim().length > 20;
  const isStep2Valid = techStack.length > 0 && budget && !isNaN(parseFloat(budget)) && parseFloat(budget) > 0;

  return (
    <div className="max-w-3xl animate-fade-in mx-auto space-y-8 pb-12">
      {/* Header with Breadcrumbs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
           <Briefcase className="w-3.5 h-3.5" /> Project Creator
           <ArrowRight className="w-3 h-3 mx-1" /> New Listing
        </div>
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Post a New Project</h1>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-muted/30 border border-border">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === i ? 'bg-primary text-primary-foreground shadow-md' : step > i ? 'bg-emerald-500/10 text-emerald-500' : 'text-muted-foreground'}`}>
                        {step > i ? <CheckCircle className="w-4 h-4" /> : i}
                    </div>
                ))}
            </div>
        </div>
      </div>

      <Card className="shadow-elevated border-none bg-card/60 backdrop-blur-xl transition-all overflow-hidden border border-white/5">
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="space-y-2">
                 <Label htmlFor="p-title" className="text-sm font-bold">Project Title *</Label>
                 <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Real-time Analytics Dashboard with Recharts" className="h-12 bg-background/50 text-lg font-medium" />
                 <p className="text-[10px] text-muted-foreground uppercase font-semibold">Make it descriptive to attract top talent.</p>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="p-desc" className="text-sm font-bold">Comprehensive Description *</Label>
                 <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={8} placeholder="Break down the project into specific modules, expected outcomes, and technical challenges students will face." className="bg-background/50 resize-none leading-relaxed" />
                 <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground">
                    <span>{description.length} / 2000 characters</span>
                    {description.length > 20 && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Valid duration</span>}
                 </div>
               </div>
               <Button 
                onClick={() => setStep(2)} 
                disabled={!isStep1Valid} 
                className="w-full h-12 gradient-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/20"
               >
                 Continue to Technicals <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="space-y-4">
                  <Label className="text-sm font-bold flex items-center gap-2"><Code className="w-4 h-4" /> Required Technology Stack</Label>
                  <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-xl bg-background/30 border border-border">
                    {techStack.length === 0 && <span className="text-xs text-muted-foreground italic">No tech selected. Use the input below...</span>}
                    {techStack.map(t => (
                      <Badge key={t} variant="secondary" className="pl-3 pr-1.5 py-1 text-xs gap-1 shadow-sm border border-white/5">
                        {t} <button onClick={() => removeTech(t)} className="hover:text-red-400 p-0.5"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addTech(techInput))} placeholder="Add technology (e.g. Docker)..." className="h-10 bg-background/50" />
                    <Button variant="outline" size="sm" onClick={() => addTech(techInput)} disabled={!techInput.trim()}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_TECH.filter(t => !techStack.includes(t)).slice(0, 10).map(t => (
                      <button key={t} onClick={() => addTech(t)} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20 decoration-none">
                        + {t}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold flex items-center gap-2"><DollarSign className="w-4 h-4" /> Proposed Budget</Label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">$</span>
                       <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 5000" className="pl-7 h-11 bg-background/50 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold flex items-center gap-2"><Calendar className="w-4 h-4" /> Estimated Deadline</Label>
                    <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} className="h-11 bg-background/50" />
                  </div>
               </div>

               <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="h-12 px-8 font-bold" onClick={() => setStep(1)}>Back</Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    disabled={!isStep2Valid} 
                    className="flex-1 h-12 gradient-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/20"
                  >
                    Preview Listing <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in zoom-in-95 duration-400">
               <div className="p-10 rounded-3xl bg-background/50 border border-white/5 relative overflow-hidden shadow-card">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] select-none pointer-events-none transform rotate-12">
                     <Briefcase className="w-48 h-48" />
                  </div>
                  <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1 shadow-sm uppercase text-[10px] font-bold tracking-widest">Project Summary</Badge>
                  <h2 className="text-4xl font-extrabold text-foreground tracking-tight mb-4">{title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6 mb-8 whitespace-pre-wrap">{description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                     {techStack.map(t => <Badge key={t} variant="outline" className="bg-primary/5 border-primary/20 text-xs px-3">{t}</Badge>)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-8">
                     <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Budget Allocation</p>
                        <p className="text-2xl font-black text-foreground">₹{Number(budget).toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Target Deadline</p>
                        <p className="text-2xl font-black text-foreground">{deadline ? new Date(deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Flexible'}</p>
                     </div>
                  </div>
               </div>

               <div className="flex gap-3">
                  <Button variant="outline" className="h-12 px-8 font-bold" onClick={() => setStep(2)}>Adjust Details</Button>
                  <Button 
                    onClick={submit} 
                    disabled={submitting} 
                    className="flex-1 h-12 gradient-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/30"
                  >
                    {submitting ? 'Engine Publishing...' : 'Publish to Talent Network'}
                  </Button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
         <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Trusted by tech teams globally</p>
      </div>
    </div>
  );
}
