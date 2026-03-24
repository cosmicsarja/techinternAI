import { useEffect, useState, useCallback } from 'react';
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  created_at: string;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  info: { icon: Info, color: 'text-blue-400' },
  success: { icon: CheckCircle, color: 'text-emerald-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-400' },
  error: { icon: XCircle, color: 'text-red-400' },
};

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);
    if (data) setNotifications(data as Notification[]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 15));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchNotifications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" id="notifications-btn">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold border border-background">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-elevated" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-semibold text-sm">
            Notifications
            {unread > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
                {unread} new
              </span>
            )}
          </h4>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => {
              const { icon: Icon, color } = typeConfig[n.type] || typeConfig.info;
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left flex items-start gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`w-3.5 h-3.5 ${!n.read ? color : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
