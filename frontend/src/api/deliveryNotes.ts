import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, buildQueryString } from './client';
import type { CreateDeliveryNote, DeliveryNote, DeliveryNoteSummary, VoidDocument } from './types';

const KEY = 'delivery-notes';

export function useDeliveryNotes(params: { invoiceId?: number; customerId?: number } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<DeliveryNoteSummary[]>(`/delivery-notes${buildQueryString(params)}`),
  });
}

export function useDeliveryNote(id: number | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<DeliveryNote>(`/delivery-notes/${id}`),
    enabled: id !== undefined,
  });
}

export function useCreateDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDeliveryNote) => api.post<DeliveryNote>('/delivery-notes', dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.invoiceId, 'deliverable-lines'] });
    },
  });
}

export function useVoidDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: VoidDocument }) => api.post<DeliveryNote>(`/delivery-notes/${id}/void`, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['invoices', data.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', data.invoiceId, 'deliverable-lines'] });
    },
  });
}

export function useRegenerateDeliveryNotePdf() {
  return useMutation({
    mutationFn: (id: number) => api.post<{ pdfPath: string }>(`/delivery-notes/${id}/pdf/regenerate`),
  });
}
