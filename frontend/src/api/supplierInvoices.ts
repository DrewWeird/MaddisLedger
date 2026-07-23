import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, buildQueryString } from './client';
import type {
  CreateSupplierInvoice,
  CreateSupplierPayment,
  SupplierInvoice,
  SupplierInvoiceSummary,
  VoidDocument,
} from './types';

const KEY = 'supplier-invoices';

export function useSupplierInvoices(params: { supplierId?: number; status?: string; from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<SupplierInvoiceSummary[]>(`/supplier-invoices${buildQueryString(params)}`),
  });
}

export function useSupplierInvoice(id: number | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<SupplierInvoice>(`/supplier-invoices/${id}`),
    enabled: id !== undefined,
  });
}

export function useCreateSupplierInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSupplierInvoice) => api.post<SupplierInvoice>('/supplier-invoices', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRecordSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CreateSupplierPayment }) =>
      api.post<SupplierInvoice>(`/supplier-invoices/${id}/payments`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useVoidSupplierInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: VoidDocument }) => api.post<SupplierInvoice>(`/supplier-invoices/${id}/void`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
