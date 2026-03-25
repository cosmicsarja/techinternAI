import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  LogOut, Shield, Mail, User, Lock, Bell, Trash2,
  CheckCircle, AlertTriangle, Moon, Sun, Github, Globe, Linkedin, Link2
} from 'lucide-react';

export default function StudentSettings() {
  const { signOut, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    bids: true,
    milestones: true,
    payments: true,
    reviews: true,
  });

  // Links state
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Load existing links from profile
  useEffect(() => {
    if (profile) {
      setGithubUrl((profile as any).github_url || '');
      setPortfolioUrl((profile as any).portfolio_url || '');
      setLinkedinUrl((profile as any).linkedin_url || '');
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPw(false);
  };

  const handleSaveLinks = async () => {
    if (!profile) return;
    setSavingLinks(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        github_url: githubUrl.trim(),
        portfolio_url: portfolioUrl.trim(),
        linkedin_url: linkedinUrl.trim(),
      })
      .eq('id', profile.id);
    if (error) {
      toast.error('Failed to save links: ' + error.message);
    } else {
      await refreshProfile();
      toast.success('Links saved! AI matching will use these to find better projects.');
    }
    setSavingLinks(false);
  };

  const roleColor: Record<string, string> = {
    student: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    company: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    admin: 'bg-red-500/15 text-red-400 border-red-500/20',
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account preferences</p>
      </div>

      {/* Account Info */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{profile?.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium text-foreground capitalize">{profile?.role}</p>
              </div>
            </div>
            <Badge variant="secondary" className={`border text-xs capitalize ${roleColor[profile?.role || 'student']}`}>
              {profile?.role}
            </Badge>
          </div>
          {profile?.role === 'student' && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Skill Score</p>
                  <p className="text-sm font-medium text-foreground">{profile?.skill_score ?? 0} points</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Links for AI Matching — only for students */}
      {profile?.role === 'student' && (
        <Card className="shadow-card border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" /> Profile Links
              <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase">
                Boosts AI Matching
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Add your links so companies and AI matching can evaluate your work and find you better projects.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-url" className="flex items-center gap-2">
                <Github className="w-3.5 h-3.5" /> GitHub URL
              </Label>
              <Input
                id="github-url"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio-url" className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Portfolio / Website URL
              </Label>
              <Input
                id="portfolio-url"
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin-url" className="flex items-center gap-2">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn URL
              </Label>
              <Input
                id="linkedin-url"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <Button
              id="save-links-btn"
              onClick={handleSaveLinks}
              disabled={savingLinks}
              className="gradient-primary text-primary-foreground w-full"
            >
              {savingLinks ? 'Saving...' : 'Save Links'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Change Password */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min. 6 characters)"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>
          <Button
            id="change-password-btn"
            onClick={handleChangePassword}
            disabled={changingPw || !newPassword || !confirmPassword}
            className="gradient-primary text-primary-foreground"
          >
            {changingPw ? 'Updating...' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(notifPrefs).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground capitalize">{key} notifications</p>
                <p className="text-xs text-muted-foreground">Receive alerts for {key} activity</p>
              </div>
              <button
                onClick={() => setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${val ? 'bg-primary' : 'bg-muted'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${val ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Note: Notification preferences are saved locally in this session.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="shadow-card border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <div>
              <p className="text-sm font-medium text-foreground">Sign out</p>
              <p className="text-xs text-muted-foreground">Sign out from all devices</p>
            </div>
            <Button
              id="sign-out-btn"
              variant="destructive"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
