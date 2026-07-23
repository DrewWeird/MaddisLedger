import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from './client';
import type { DashboardSummary, LowStockItem } from './types';

export interface SalesTrendPoint {
  date: string;
  totalZar: number;
}

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

export function useSalesTrend(days: number) {
  return useQuery({
    queryKey: ['dashboard', 'sales-trend', days],
    queryFn: () => api.get<SalesTrendPoint[]>(`/dashboard/sales-trend${buildQueryString({ days })}`),
  });
}
