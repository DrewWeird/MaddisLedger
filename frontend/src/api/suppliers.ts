import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, buildQueryString } from './client';
import type { SaveSupplier, Supplier } from './types';

const KEY = 'suppliers';

export function useSuppliers(params: { search?: string } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Supplier[]>(`/suppliers${buildQueryString(params)}`),
  });
}

export function useSupplier(id: number | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<Supplier>(`/suppliers/${id}`),
    enabled: id !== undefined,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SaveSupplier) => api.post<Supplier>('/suppliers', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SaveSupplier }) => api.put<Supplier>(`/suppliers/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
