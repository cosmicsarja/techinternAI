import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Code2, ArrowRight, Users, Briefcase, Shield, Zap,
  CheckCircle, Star, DollarSign, GitBranch, Terminal, Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Users,
    title: 'For Students',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    points: ['Browse & bid on real projects', 'Lead teams & earn money', 'Build a portfolio that matters'],
  },
  {
    icon: Briefcase,
    title: 'For Companies',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    points: ['Post projects & set your budget', 'Review talent & select the best', 'Track progress with milestones'],
  },
  {
    icon: Shield,
    title: 'Secure & Transparent',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    points: ['Built-in escrow payments', 'Milestone-based fund release', 'Verified review system'],
  },
];

const workflow = [
  { icon: Briefcase, step: '01', title: 'Company Posts Project', desc: 'Set requirements, budget, and deadline' },
  { icon: Users, step: '02', title: 'Students Bid', desc: 'Talented students submit detailed proposals' },
  { icon: CheckCircle, step: '03', title: 'Leader Selected', desc: 'Best bid is accepted, team is assembled' },
  { icon: Code2, step: '04', title: 'Build & Deliver', desc: 'Live workspace, milestones, and code collaboration' },
  { icon: DollarSign, step: '05', title: 'Payment Released', desc: 'Funds released after milestone approval' },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground">TechIntern Connect</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="gradient-primary text-primary-foreground">
              Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Real projects. Real money. Real experience.
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-tight tracking-tight">
            Where Students Build<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
              Real Projects
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            Companies post software projects. Students bid, collaborate, and deliver — all inside an integrated platform with built-in code workspaces, milestone tracking, and secure payments.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10 flex-wrap">
            <Button size="lg" onClick={() => navigate('/auth')} className="gradient-primary text-primary-foreground shadow-lg h-12 px-8 text-base">
              Start Building <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="h-12 px-8 text-base">
              Post a Project
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Everything you need, built in</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">One platform for the entire project lifecycle — from bid to payment.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className={`p-6 rounded-2xl border ${f.bg} shadow-card hover:shadow-elevated transition-all`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${f.bg}`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">{f.title}</h3>
              <ul className="space-y-2">
                {f.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${f.color}`} />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Platform Features Row */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Terminal, label: 'Live Code Workspace', desc: 'Monaco-powered IDE in the browser' },
            { icon: GitBranch, label: 'Milestone Tracking', desc: 'Structured progress with approvals' },
            { icon: Star, label: 'Review System', desc: 'Verified ratings after project completion' },
            { icon: Layers, label: 'Real-time Updates', desc: 'Supabase-powered live collaboration' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-xl bg-card border border-border shadow-card text-center hover:shadow-elevated transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">How it works</h2>
          <p className="text-muted-foreground mt-3">From project post to payment in 5 steps</p>
        </div>
        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-px bg-border hidden md:block" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {workflow.map((w) => (
              <div key={w.step} className="flex flex-col items-center text-center relative">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-lg z-10 mb-3">
                  <w.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-bold text-primary mb-1">{w.step}</span>
                <p className="text-sm font-semibold text-foreground">{w.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-2xl gradient-primary p-10 text-center shadow-elevated">
          <h2 className="text-3xl font-bold text-primary-foreground">Ready to get started?</h2>
          <p className="text-primary-foreground/80 mt-3 max-w-lg mx-auto">
            Join thousands of students and companies already building on TechIntern Connect.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth')} className="h-11 px-8 font-semibold">
              Sign Up Free <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
            <Code2 className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">TechIntern Connect</span>
        </div>
        <p>© 2026 TechIntern Connect. Empowering the next generation of developers.</p>
      </footer>
    </div>
  );
}
