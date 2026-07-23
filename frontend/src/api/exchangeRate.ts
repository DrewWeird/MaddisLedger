import { useQuery } from '@tanstack/react-query';
import { api, buildQueryString } from './client';

export interface ExchangeRate {
  rate: number | null;
  asOf: string | null;
  available: boolean;
}

export function useExchangeRate(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: ['exchange-rate', from, to],
    queryFn: () => api.get<ExchangeRate>(`/exchange-rate${buildQueryString({ from, to })}`),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
