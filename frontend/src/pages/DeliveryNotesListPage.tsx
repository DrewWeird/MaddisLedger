import { Badge, Stack, Table, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useDeliveryNotes } from '../api/deliveryNotes';
import { formatDate } from '../utils/format';

export function DeliveryNotesListPage() {
  const navigate = useNavigate();
  const { data: deliveryNotes, isLoading } = useDeliveryNotes();

  return (
    <Stack>
      <Title order={2}>Delivery Notes</Title>
      <Text c="dimmed" size="sm">Delivery notes are created from an existing invoice — open an invoice to create one.</Text>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Delivery Note #</Table.Th>
            <Table.Th>Invoice #</Table.Th>
            <Table.Th>Customer</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {deliveryNotes?.map((note) => (
            <Table.Tr key={note.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/delivery-notes/${note.id}`)}>
              <Table.Td>{note.deliveryNoteNumber}</Table.Td>
              <Table.Td>{note.invoiceNumber}</Table.Td>
              <Table.Td>{note.customerNameSnapshot}</Table.Td>
              <Table.Td>{formatDate(note.deliveryDate)}</Table.Td>
              <Table.Td>
                <Badge color={note.status === 'Active' ? 'green' : 'gray'}>{note.status}</Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {!isLoading && deliveryNotes?.length === 0 && <Text c="dimmed">No delivery notes found.</Text>}
    </Stack>
  );
}
