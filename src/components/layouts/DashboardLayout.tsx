import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import StudentSidebar from '@/components/sidebars/StudentSidebar';
import CompanySidebar from '@/components/sidebars/CompanySidebar';
import AdminSidebar from '@/components/sidebars/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationDropdown from '@/components/NotificationDropdown';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Setting up your profile...</div>
      </div>
    );
  }

  const SidebarComponent =
    profile.role === 'admin' ? AdminSidebar :
    profile.role === 'company' ? CompanySidebar :
    StudentSidebar;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarComponent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground capitalize">
                {profile.role} Panel
              </span>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:block">{profile.name}</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
