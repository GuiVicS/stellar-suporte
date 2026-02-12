import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/integrations/api/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<Notification[]>({
    queryKey: ['notifications', user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return [];
      const data = await apiGet<Notification[]>('/api/notifications');
      return data;
    },
    enabled: !!user?.user_id,
  });

  const unreadCount = (query.data ?? []).filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await apiPatch(`/api/notifications/${id}/read`, {});
    qc.invalidateQueries({ queryKey: ['notifications', user?.user_id] });
  };

  const markAllAsRead = async () => {
    if (!user?.user_id) return;
    await apiPatch('/api/notifications/read-all', {});
    qc.invalidateQueries({ queryKey: ['notifications', user?.user_id] });
  };

  return { ...query, unreadCount, markAsRead, markAllAsRead };
};
