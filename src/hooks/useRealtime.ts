import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeConfig {
  table: string;
  event?: RealtimeEvent;
  filter?: string;
  onData: (payload: any) => void;
}

/**
 * Hook subscribes to one or more Supabase realtime channels and cleans up
 * when the component unmounts or deps change.
 */
export function useRealtime(configs: RealtimeConfig[], deps: any[] = []) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channelName = `rt_${configs.map((c) => c.table).join('_')}_${Date.now()}`;
    let ch = supabase.channel(channelName);

    configs.forEach(({ table, event = '*', filter, onData }) => {
      ch = ch.on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        onData
      );
    });

    ch.subscribe();
    channelRef.current = ch;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
