import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { DashboardSummary, LowStockItem } from './types';

export function useLowStockItems() {
  return useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: () => api.get<LowStockItem[]>('/dashboard/low-stock'),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
  });
}
