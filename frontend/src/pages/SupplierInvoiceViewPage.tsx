import { Badge, Button, Group, Modal, NumberInput, Stack, Table, Text, Textarea, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCash, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useRecordSupplierPayment, useSupplierInvoice, useVoidSupplierInvoice } from '../api/supplierInvoices';
import { formatCurrency, formatDate } from '../utils/format';

interface PaymentFormValues {
  paymentDate: Date;
  amount: number;
  notes: string;
}

export function SupplierInvoiceViewPage() {
  const { id } = useParams();
  const supplierInvoiceId = Number(id);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  const { data: invoice, isLoading } = useSupplierInvoice(supplierInvoiceId);
  const recordPayment = useRecordSupplierPayment();
  const voidMutation = useVoidSupplierInvoice();

  const { control, handleSubmit, reset } = useForm<PaymentFormValues>({
    defaultValues: { paymentDate: new Date(), amount: 0, notes: '' },
  });

  useEffect(() => {
    if (invoice) {
      reset({ paymentDate: new Date(), amount: invoice.amountOutstanding, notes: '' });
    }
  }, [invoice, reset]);

  if (isLoading || !invoice) return <Text>Loading...</Text>;

  async function handleVoid() {
    try {
      await voidMutation.mutateAsync({ id: supplierInvoiceId, dto: { reason: voidReason || undefined } });
      notifications.show({ message: 'Supplier invoice voided', color: 'green' });
      setVoidModalOpen(false);
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  async function onSubmitPayment(values: PaymentFormValues) {
    try {
      await recordPayment.mutateAsync({
        id: supplierInvoiceId,
        dto: { paymentDate: values.paymentDate.toISOString(), amount: values.amount, notes: values.notes || undefined },
      });
      notifications.show({ message: 'Payment recorded', color: 'green' });
      setPaymentModalOpen(false);
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>
          {invoice.supplierName} <Badge color={invoice.status === 'Active' ? 'green' : 'gray'}>{invoice.status}</Badge>
        </Title>
        {invoice.status === 'Active' && (
          <Group>
            {invoice.amountOutstanding > 0 && (
              <Button leftSection={<IconCash size={16} />} onClick={() => setPaymentModalOpen(true)}>
                Record Payment
              </Button>
            )}
            <Button color="red" variant="outline" leftSection={<IconX size={16} />} onClick={() => setVoidModalOpen(true)}>
              Void
            </Button>
          </Group>
        )}
      </Group>

      <Group grow>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Reference</Text>
          <Text>{invoice.supplierReference}</Text>
        </Stack>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Issue Date</Text>
          <Text>{formatDate(invoice.issueDate)}</Text>
        </Stack>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Total</Text>
          <Text>{formatCurrency(invoice.total)}</Text>
        </Stack>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Outstanding</Text>
          <Text fw={700} c={invoice.amountOutstanding > 0 ? 'orange' : 'green'}>
            {formatCurrency(invoice.amountOutstanding)}
          </Text>
        </Stack>
      </Group>

      {invoice.description && (
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Description</Text>
          <Text>{invoice.description}</Text>
        </Stack>
      )}

      <Title order={4} mt="md">Payments</Title>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Notes</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invoice.payments.map((payment) => (
            <Table.Tr key={payment.id}>
              <Table.Td>{formatDate(payment.paymentDate)}</Table.Td>
              <Table.Td>{formatCurrency(payment.amount)}</Table.Td>
              <Table.Td>{payment.notes ?? '—'}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {invoice.payments.length === 0 && <Text c="dimmed">No payments recorded yet.</Text>}

      <Modal opened={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Record Payment">
        <form onSubmit={handleSubmit(onSubmitPayment)}>
          <Stack>
            <Controller
              name="paymentDate"
              control={control}
              render={({ field }) => (
                <DateInput label="Payment Date" value={field.value} onChange={(v) => field.onChange(v ? new Date(v) : new Date())} valueFormat="DD/MM/YYYY" />
              )}
            />
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Amount (R)"
                  min={0}
                  max={invoice.amountOutstanding}
                  decimalScale={2}
                  value={field.value}
                  onChange={(v) => field.onChange(Number(v) || 0)}
                  description={`Outstanding: ${formatCurrency(invoice.amountOutstanding)}`}
                />
              )}
            />
            <Controller
              name="notes"
              control={control}
              render={({ field }) => <Textarea label="Notes" value={field.value} onChange={(e) => field.onChange(e.currentTarget.value)} />}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={recordPayment.isPending}>Record Payment</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={voidModalOpen} onClose={() => setVoidModalOpen(false)} title="Void Supplier Invoice">
        <Stack>
          <Textarea label="Reason (optional)" value={voidReason} onChange={(e) => setVoidReason(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVoidModalOpen(false)}>Cancel</Button>
            <Button color="red" onClick={handleVoid} loading={voidMutation.isPending}>Void</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
