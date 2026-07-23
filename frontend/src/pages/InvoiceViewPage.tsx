import { Badge, Button, Group, Modal, Stack, Table, Text, Textarea, Title } from '@mantine/core';
import { IconFileTypePdf, IconTruckDelivery, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useInvoice, useVoidInvoice } from '../api/invoices';
import { useDeliveryNotes } from '../api/deliveryNotes';
import { formatCurrency, formatDate } from '../utils/format';
import { openPdf } from '../utils/openPdf';

export function InvoiceViewPage() {
  const { id } = useParams();
  const invoiceId = Number(id);
  const navigate = useNavigate();
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: deliveryNotes } = useDeliveryNotes({ invoiceId });
  const voidMutation = useVoidInvoice();

  if (isLoading || !invoice) return <Text>Loading...</Text>;

  const hasActiveDeliveryNote = deliveryNotes?.some((d) => d.status === 'Active');

  async function handleVoid() {
    try {
      await voidMutation.mutateAsync({ id: invoiceId, dto: { reason: voidReason || undefined } });
      notifications.show({ message: 'Invoice voided', color: 'green' });
      setVoidModalOpen(false);
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>
          Invoice {invoice.invoiceNumber} <Badge color={invoice.status === 'Active' ? 'green' : 'gray'}>{invoice.status}</Badge>{' '}
          {invoice.currency === 'USD' && <Badge color="blue" variant="light">USD</Badge>}
        </Title>
        <Group>
          <Button
            variant="default"
            leftSection={<IconFileTypePdf size={16} />}
            onClick={() => openPdf(invoice.pdfPath, `/api/invoices/${invoiceId}/pdf`)}
          >
            Open PDF
          </Button>
          {invoice.status === 'Active' && (
            <>
              <Button
                variant="default"
                leftSection={<IconTruckDelivery size={16} />}
                onClick={() => navigate(`/delivery-notes/new?invoiceId=${invoiceId}`)}
              >
                Create Delivery Note
              </Button>
              <Button color="red" variant="outline" leftSection={<IconX size={16} />} onClick={() => setVoidModalOpen(true)}>
                Void
              </Button>
            </>
          )}
        </Group>
      </Group>

      <Group grow>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Customer</Text>
          <Text>{invoice.customerNameSnapshot}</Text>
          {invoice.customerAddressSnapshot && <Text size="sm" c="dimmed">{invoice.customerAddressSnapshot}</Text>}
        </Stack>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Issue Date</Text>
          <Text>{formatDate(invoice.issueDate)}</Text>
        </Stack>
      </Group>

      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Description</Table.Th>
            <Table.Th>Qty</Table.Th>
            <Table.Th>Unit Price</Table.Th>
            <Table.Th>Line Total</Table.Th>
            <Table.Th>Delivered</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invoice.lineItems.map((line) => (
            <Table.Tr key={line.id}>
              <Table.Td>{line.descriptionSnapshot}</Table.Td>
              <Table.Td>{line.quantity}</Table.Td>
              <Table.Td>{formatCurrency(line.unitPriceSnapshot, invoice.currency)}</Table.Td>
              <Table.Td>{formatCurrency(line.lineTotal, invoice.currency)}</Table.Td>
              <Table.Td>{line.deliveredQuantity} / {line.quantity}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify="flex-end">
        <Title order={3}>Total: {formatCurrency(invoice.total, invoice.currency)}</Title>
      </Group>

      {invoice.currency === 'USD' && (
        <Text size="xs" c="dimmed" ta="right">
          1 USD = R{invoice.exchangeRateToZar.toFixed(2)}
          {invoice.exchangeRateAsOf && ` as of ${formatDate(invoice.exchangeRateAsOf)}`}
        </Text>
      )}

      {invoice.notes && (
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Notes</Text>
          <Text>{invoice.notes}</Text>
        </Stack>
      )}

      {deliveryNotes && deliveryNotes.length > 0 && (
        <Stack mt="md">
          <Title order={4}>Delivery Notes</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Delivery Note #</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {deliveryNotes.map((note) => (
                <Table.Tr key={note.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/delivery-notes/${note.id}`)}>
                  <Table.Td>{note.deliveryNoteNumber}</Table.Td>
                  <Table.Td>{formatDate(note.deliveryDate)}</Table.Td>
                  <Table.Td>
                    <Badge color={note.status === 'Active' ? 'green' : 'gray'}>{note.status}</Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      )}

      <Modal opened={voidModalOpen} onClose={() => setVoidModalOpen(false)} title="Void Invoice">
        <Stack>
          {hasActiveDeliveryNote && (
            <Text c="red" size="sm">
              This invoice has active delivery notes. Void those first before voiding this invoice.
            </Text>
          )}
          <Textarea label="Reason (optional)" value={voidReason} onChange={(e) => setVoidReason(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVoidModalOpen(false)}>Cancel</Button>
            <Button color="red" onClick={handleVoid} loading={voidMutation.isPending} disabled={hasActiveDeliveryNote}>
              Void Invoice
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
