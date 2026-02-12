import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/integrations/api/client';

export const useServiceOrders = () => {
  return useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const data = await apiGet<any[]>('/api/service-orders');
      return data;
    },
  });
};

export const useCreateServiceOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: any) => {
      const created = await apiPost<any>('/api/service-orders', order);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
};

export const useUpdateServiceOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const updated = await apiPut<any>(`/api/service-orders/${id}`, updates);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
};
