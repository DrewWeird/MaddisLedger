import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, buildQueryString } from './client';
import type { Customer, SaveCustomer } from './types';

const KEY = 'customers';

export function useCustomers(params: { search?: string } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Customer[]>(`/customers${buildQueryString(params)}`),
  });
}

export function useCustomer(id: number | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<Customer>(`/customers/${id}`),
    enabled: id !== undefined,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SaveCustomer) => api.post<Customer>('/customers', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SaveCustomer }) => api.put<Customer>(`/customers/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
