import { Badge, Button, Group, Modal, Stack, Table, Text, Textarea, Title } from '@mantine/core';
import { IconFileTypePdf, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useDeliveryNote, useVoidDeliveryNote } from '../api/deliveryNotes';
import { formatDate } from '../utils/format';
import { openPdf } from '../utils/openPdf';

export function DeliveryNoteViewPage() {
  const { id } = useParams();
  const deliveryNoteId = Number(id);
  const navigate = useNavigate();
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  const { data: note, isLoading } = useDeliveryNote(deliveryNoteId);
  const voidMutation = useVoidDeliveryNote();

  if (isLoading || !note) return <Text>Loading...</Text>;

  async function handleVoid() {
    try {
      await voidMutation.mutateAsync({ id: deliveryNoteId, dto: { reason: voidReason || undefined } });
      notifications.show({ message: 'Delivery note voided', color: 'green' });
      setVoidModalOpen(false);
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>
          Delivery Note {note.deliveryNoteNumber} <Badge color={note.status === 'Active' ? 'green' : 'gray'}>{note.status}</Badge>
        </Title>
        <Group>
          <Button
            variant="default"
            leftSection={<IconFileTypePdf size={16} />}
            onClick={() => openPdf(note.pdfPath, `/api/delivery-notes/${deliveryNoteId}/pdf`)}
          >
            Open PDF
          </Button>
          {note.status === 'Active' && (
            <Button color="red" variant="outline" leftSection={<IconX size={16} />} onClick={() => setVoidModalOpen(true)}>
              Void
            </Button>
          )}
        </Group>
      </Group>

      <Group grow>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Customer</Text>
          <Text>{note.customerNameSnapshot}</Text>
        </Stack>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Invoice</Text>
          <Text
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate(`/invoices/${note.invoiceId}`)}
          >
            {note.invoiceNumber}
          </Text>
        </Stack>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Delivery Date</Text>
          <Text>{formatDate(note.deliveryDate)}</Text>
        </Stack>
      </Group>

      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Description</Table.Th>
            <Table.Th>Qty Delivered</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {note.lineItems.map((line) => (
            <Table.Tr key={line.id}>
              <Table.Td>{line.descriptionSnapshot}</Table.Td>
              <Table.Td>{line.quantityDelivered}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {note.notes && (
        <Stack gap={2}>
          <Text size="sm" c="dimmed">Notes</Text>
          <Text>{note.notes}</Text>
        </Stack>
      )}

      <Modal opened={voidModalOpen} onClose={() => setVoidModalOpen(false)} title="Void Delivery Note">
        <Stack>
          <Textarea label="Reason (optional)" value={voidReason} onChange={(e) => setVoidReason(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVoidModalOpen(false)}>Cancel</Button>
            <Button color="red" onClick={handleVoid} loading={voidMutation.isPending}>Void Delivery Note</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
