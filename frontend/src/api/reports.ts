import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from './client';

export interface LedgerSummary {
  from: string;
  to: string;
  totalRevenueZar: number;
  totalCostOfGoodsSoldZar: number;
  grossProfitZar: number;
  totalOtherExpensesZar: number;
  netProfitZar: number;
  invoiceCount: number;
  supplierInvoiceCount: number;
}

export function useLedgerSummary(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'ledger-summary', from, to],
    queryFn: () => api.get<LedgerSummary>(`/reports/ledger-summary${buildQueryString({ from, to })}`),
    enabled: !!from && !!to,
  });
}

export interface LedgerTrendPoint {
  periodStart: string;
  periodLabel: string;
  revenueZar: number;
  costOfGoodsSoldZar: number;
  otherExpensesZar: number;
  netProfitZar: number;
}

export function useLedgerTrend(from: string, to: string, bucket: 'week' | 'month') {
  return useQuery({
    queryKey: ['reports', 'ledger-trend', from, to, bucket],
    queryFn: () => api.get<LedgerTrendPoint[]>(`/reports/ledger-trend${buildQueryString({ from, to, bucket })}`),
    enabled: !!from && !!to,
  });
}

export interface CategoryBreakdownPoint {
  category: string;
  revenueZar: number;
}

export function useCategoryBreakdown(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'category-breakdown', from, to],
    queryFn: () => api.get<CategoryBreakdownPoint[]>(`/reports/category-breakdown${buildQueryString({ from, to })}`),
    enabled: !!from && !!to,
  });
}
