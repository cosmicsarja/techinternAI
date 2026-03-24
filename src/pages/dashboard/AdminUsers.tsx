import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search, Shield, User2, Building2, Trash2, RefreshCw } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';

const roleConfig: Record<string, { color: string; icon: any }> = {
  student: { color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: User2 },
  company: { color: 'bg-purple-500/15 text-purple-400 border-purple-500/20', icon: Building2 },
  admin: { color: 'bg-red-500/15 text-red-400 border-red-500/20', icon: Shield },
};

export default function AdminUsers() {
  const { profile: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useRealtime([{ table: 'profiles', onData: () => fetchUsers() }], []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const counts = {
    all: users.length,
    student: users.filter((u) => u.role === 'student').length,
    company: users.filter((u) => u.role === 'company').length,
    admin: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} registered users</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="user-search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'student', 'company', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                roleFilter === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {r} ({counts[r] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <User2 className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const { color, icon: Icon } = roleConfig[u.role] || roleConfig.student;
            const isSelf = u.id === currentUser?.id;
            return (
              <Card key={u.id} className={`shadow-card ${isSelf ? 'border-primary/30' : ''}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm truncate">{u.name || 'Unnamed'}</p>
                      {isSelf && <span className="text-[10px] text-primary font-medium">(you)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      Joined {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                    </span>
                    {u.role === 'student' && (
                      <span className="text-xs text-muted-foreground hidden sm:block bg-muted px-1.5 py-0.5 rounded">
                        Score: {u.skill_score}
                      </span>
                    )}
                    <Badge variant="secondary" className={`border text-[10px] capitalize ${color}`}>
                      {u.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
