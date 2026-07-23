import { useState } from 'react';
import { Badge, Button, Group, Select, Stack, Table, Text, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../api/invoices';
import { formatCurrency, formatDate } from '../utils/format';

export function InvoicesListPage() {
  const [status, setStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useInvoices({ status: status ?? undefined });

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Invoices</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/invoices/new')}>
          New Invoice
        </Button>
      </Group>

      <Select
        placeholder="Filter by status"
        clearable
        data={[{ value: 'Active', label: 'Active' }, { value: 'Voided', label: 'Voided' }]}
        value={status}
        onChange={setStatus}
        w={200}
      />

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Invoice #</Table.Th>
            <Table.Th>Customer</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invoices?.map((invoice) => (
            <Table.Tr key={invoice.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${invoice.id}`)}>
              <Table.Td>{invoice.invoiceNumber}</Table.Td>
              <Table.Td>{invoice.customerNameSnapshot}</Table.Td>
              <Table.Td>{formatDate(invoice.issueDate)}</Table.Td>
              <Table.Td>{formatCurrency(invoice.total)}</Table.Td>
              <Table.Td>
                <Badge color={invoice.status === 'Active' ? 'green' : 'gray'}>{invoice.status}</Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {!isLoading && invoices?.length === 0 && <Text c="dimmed">No invoices found.</Text>}
    </Stack>
  );
}
