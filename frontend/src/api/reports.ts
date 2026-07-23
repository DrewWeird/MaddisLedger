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
