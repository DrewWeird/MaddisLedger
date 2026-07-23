import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, buildQueryString } from './client';
import type { SaveStockItem, StockItem } from './types';

const KEY = 'stock-items';

export function useStockItems(params: { activeOnly?: boolean; search?: string } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<StockItem[]>(`/stock-items${buildQueryString(params)}`),
  });
}

export function useStockItem(id: number | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<StockItem>(`/stock-items/${id}`),
    enabled: id !== undefined,
  });
}

export function useCreateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SaveStockItem) => api.post<StockItem>('/stock-items', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateStockItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SaveStockItem }) => api.put<StockItem>(`/stock-items/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
