import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/integrations/api/client';

export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      return apiGet<any[]>('/api/profiles');
    },
  });
};

export const useTechnicians = () => {
  return useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      return apiGet<any[]>('/api/profiles/technicians');
    },
  });
};
