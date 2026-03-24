import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Code2, GraduationCap, Building2, Eye, EyeOff, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type UserRole = 'student' | 'company';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Please fill in all fields'); return; }
    if (!isLogin && !name.trim()) { toast.error('Please enter your name'); return; }
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email.trim(), password);
        toast.success('Welcome back!');
      } else {
        await signUp(email.trim(), password, name.trim(), role);
        toast.success('Account created! Redirecting...');
      }
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">TechIntern Connect</span>
        </div>
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-medium mb-6">
              <Zap className="w-3.5 h-3.5" /> Real projects. Real money.
            </div>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Build your future,<br />one project at a time.
            </h2>
            <p className="text-white/70 mt-4 text-base leading-relaxed">
              Join thousands of students and companies collaborating on real-world software projects with escrow payments, code workspaces, and milestone tracking.
            </p>
          </div>
          <div className="space-y-3">
            {[
              'Students earn money on real projects',
              'Companies get quality software delivered',
              'Built-in IDE, milestones & secure payments',
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-white/80 shrink-0" />
                <span className="text-white/90 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-sm">© 2026 TechIntern Connect</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">TechIntern Connect</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isLogin ? 'Enter your credentials to access your dashboard' : 'Get started free — no credit card required'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['student', 'company'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
                          role === r ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        {r === 'student'
                          ? <GraduationCap className={`w-6 h-6 ${role === r ? 'text-primary' : 'text-muted-foreground'}`} />
                          : <Building2 className={`w-6 h-6 ${role === r ? 'text-primary' : 'text-muted-foreground'}`} />
                        }
                        <span className={`text-sm font-medium capitalize ${role === r ? 'text-primary' : 'text-muted-foreground'}`}>{r}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-name">Full Name</Label>
                  <Input
                    id="auth-name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-password">Password</Label>
              <div className="relative">
                <Input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isLogin && <p className="text-xs text-muted-foreground">Minimum 6 characters</p>}
            </div>

            <Button
              id="auth-submit-btn"
              type="submit"
              className="w-full gradient-primary text-primary-foreground h-11 font-semibold mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              id="auth-switch-btn"
              onClick={() => { setIsLogin(!isLogin); setEmail(''); setPassword(''); setName(''); }}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
