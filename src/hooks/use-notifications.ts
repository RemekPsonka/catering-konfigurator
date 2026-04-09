import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Notification = Tables<'notifications'>;

export const useUnreadCount = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unread_notification_count');
      if (error) throw error;
      return (data as number) ?? 0;
    },
    refetchInterval: 30000,
  });

  // Realtime subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // Increment count optimistically
          queryClient.setQueryData(['notification-unread-count'], (old: number | undefined) => (old ?? 0) + 1);
          // Invalidate notifications list
          queryClient.invalidateQueries({ queryKey: ['notifications'] });

          // Browser push
          const newNotif = payload.new as Notification;
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const notification = new window.Notification(newNotif.title, {
                body: newNotif.body,
                tag: newNotif.id,
              });
              notification.onclick = () => {
                window.focus();
                if (newNotif.link) {
                  window.location.href = newNotif.link;
                }
              };
            } catch { /* ignore */ }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useNotifications = (limit = 10) => {
  return useQuery({
    queryKey: ['notifications', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useAllNotifications = (page: number, filter: 'all' | 'unread' | string) => {
  const pageSize = 20;
  return useQuery({
    queryKey: ['notifications', 'all', page, filter],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter !== 'all') {
        query = query.eq('event_type', filter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { items: data ?? [], totalCount: count ?? 0, pageSize };
    },
  });
};

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('mark_notification_read', { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(['notification-unread-count'], 0);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Fire-and-forget helper for client-side notification insertion
export const fireNotification = (params: {
  offerId: string;
  eventType: string;
  title: string;
  body: string;
  link?: string;
}) => {
  Promise.resolve(
    supabase.rpc('insert_notification', {
      p_offer_id: params.offerId,
      p_event_type: params.eventType,
      p_title: params.title,
      p_body: params.body,
      p_link: params.link ?? null,
    }),
  ).catch(() => {});
};
