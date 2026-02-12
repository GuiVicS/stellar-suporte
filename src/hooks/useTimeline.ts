import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/integrations/api/client';

export const useTimeline = (osId?: string) => {
  return useQuery({
    queryKey: ['timeline', osId],
    queryFn: async () => {
      if (!osId) return [];
      return apiGet<any[]>(`/api/timeline/service-orders/${osId}/timeline`);
    },
    enabled: !!osId,
  });
};

export const useAddTimelineComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (comment: { os_id: string; kind: string; message: string; created_by?: string }) => {
      await apiPost('/api/timeline', comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
};
