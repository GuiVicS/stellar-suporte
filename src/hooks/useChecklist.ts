import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/integrations/api/client';

export const useChecklist = (osId?: string) => {
  return useQuery({
    queryKey: ['checklist', osId],
    queryFn: async () => {
      if (!osId) return [];
      return apiGet<any[]>(`/api/checklist/service-orders/${osId}/checklist`);
    },
    enabled: !!osId,
  });
};

export const useToggleChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      await apiPatch(`/api/checklist/${id}`, { checked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
};
