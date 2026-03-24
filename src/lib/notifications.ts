import { supabase } from '@/integrations/supabase/client';

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  await supabase.from('notifications').insert({ user_id: userId, title, message, type });
}
