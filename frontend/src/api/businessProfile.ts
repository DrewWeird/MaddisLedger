import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { BusinessProfile, SaveBusinessProfile } from './types';

const KEY = 'business-profile';

export function useBusinessProfile() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.get<BusinessProfile>('/business-profile'),
  });
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SaveBusinessProfile) => api.put<BusinessProfile>('/business-profile', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUploadBusinessLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/business-profile/logo', { method: 'POST', body: formData });
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.title ?? 'Failed to upload logo');
      }
      return (await response.json()) as BusinessProfile;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
