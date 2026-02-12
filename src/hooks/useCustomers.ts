import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/integrations/api/client';

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      return apiGet<any[]>('/api/customers');
    },
  });
};

export const useCustomerAddresses = (customerId?: string) => {
  return useQuery({
    queryKey: ['customer-addresses', customerId],
    queryFn: async () => {
      return apiGet<any[]>(`/api/customers/${customerId}/addresses`);
    },
    enabled: !!customerId,
  });
};

export const useMachines = (customerId?: string) => {
  return useQuery({
    queryKey: ['machines', customerId],
    queryFn: async () => {
      if (!customerId) return apiGet<any[]>(`/api/customers/${''}/machines`); // should not happen due to enabled flag
      return apiGet<any[]>(`/api/customers/${customerId}/machines`);
    },
    enabled: !!customerId,
  });
};
