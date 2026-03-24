import {
  LayoutDashboard, Users, Building2, AlertTriangle, ShieldCheck,
  Code2, BarChart3, Settings
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar
} from '@/components/ui/sidebar';

const items = [
  { title: 'System Overview', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Platform Analytics', url: '/dashboard/analytics', icon: BarChart3 },
  { title: 'Manage Students', url: '/dashboard/users', icon: Users },
  { title: 'Manage Companies', url: '/dashboard/companies', icon: Building2 },
  { title: 'Disputes', url: '/dashboard/disputes', icon: AlertTriangle },
  { title: 'Verification', url: '/dashboard/verification', icon: ShieldCheck },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
];

export default function AdminSidebar() {
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
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4 mt-4">Admin Hub</SidebarGroupLabel>
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
