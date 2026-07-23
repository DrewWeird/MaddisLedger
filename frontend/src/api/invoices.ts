import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, buildQueryString } from './client';
import type { CreateInvoice, DeliverableLine, Invoice, InvoiceSummary, VoidDocument } from './types';

const KEY = 'invoices';

export function useInvoices(params: { customerId?: number; status?: string; from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<InvoiceSummary[]>(`/invoices${buildQueryString(params)}`),
  });
}

export function useInvoice(id: number | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<Invoice>(`/invoices/${id}`),
    enabled: id !== undefined,
  });
}

export function useDeliverableLines(invoiceId: number | undefined) {
  return useQuery({
    queryKey: [KEY, invoiceId, 'deliverable-lines'],
    queryFn: () => api.get<DeliverableLine[]>(`/invoices/${invoiceId}/deliverable-lines`),
    enabled: invoiceId !== undefined,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInvoice) => api.post<Invoice>('/invoices', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useVoidInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: VoidDocument }) => api.post<Invoice>(`/invoices/${id}/void`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRegenerateInvoicePdf() {
  return useMutation({
    mutationFn: (id: number) => api.post<{ pdfPath: string }>(`/invoices/${id}/pdf/regenerate`),
  });
}
