import {
  LayoutDashboard, User, Search, FileText, Trophy, Users, ListTodo,
  Code2, DollarSign, Star, BarChart3, Settings, Zap
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar
} from '@/components/ui/sidebar';

const items = [
  { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Profile', url: '/dashboard/profile', icon: User },
  { title: 'AI Recommended', url: '/dashboard/recommended', icon: Zap },
  { title: 'Browse Projects', url: '/dashboard/projects', icon: Search },
  { title: 'My Bids', url: '/dashboard/bids', icon: FileText },
  { title: 'Won Projects', url: '/dashboard/won-projects', icon: Trophy },
  { title: 'Team Management', url: '/dashboard/teams', icon: Users },
  { title: 'Milestones', url: '/dashboard/milestones', icon: ListTodo },
  { title: 'Workspace', url: '/dashboard/workspace', icon: Code2 },
  { title: 'Payments', url: '/dashboard/payments', icon: DollarSign },
  { title: 'Reviews', url: '/dashboard/reviews', icon: Star },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
];

export default function StudentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <div className="p-4 border-b border-border bg-background/50 h-14 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-sm">
            <Code2 className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-sm font-bold text-foreground truncate">TechIntern Connect</span>}
        </div>
      </div>
      <SidebarContent className="bg-card">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4 mt-4">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground"
                      activeClassName="bg-primary/10 text-primary font-medium shadow-sm"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="text-sm leading-none">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
