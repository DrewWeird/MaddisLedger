import { useState } from 'react';
import { Badge, Button, Group, Select, Stack, Table, Text, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useSupplierInvoices } from '../api/supplierInvoices';
import { formatCurrency, formatDate } from '../utils/format';

export function SupplierInvoicesListPage() {
  const [status, setStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useSupplierInvoices({ status: status ?? undefined });

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Supplier Invoices</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/supplier-invoices/new')}>
          New Supplier Invoice
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
            <Table.Th>Supplier</Table.Th>
            <Table.Th>Reference</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Paid</Table.Th>
            <Table.Th>Outstanding</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invoices?.map((invoice) => (
            <Table.Tr key={invoice.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/supplier-invoices/${invoice.id}`)}>
              <Table.Td>{invoice.supplierName}</Table.Td>
              <Table.Td>{invoice.supplierReference}</Table.Td>
              <Table.Td>{formatDate(invoice.issueDate)}</Table.Td>
              <Table.Td>{formatCurrency(invoice.total)}</Table.Td>
              <Table.Td>{formatCurrency(invoice.amountPaid)}</Table.Td>
              <Table.Td>{formatCurrency(invoice.amountOutstanding)}</Table.Td>
              <Table.Td>
                <Badge color={invoice.status === 'Active' ? 'green' : 'gray'}>{invoice.status}</Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {!isLoading && invoices?.length === 0 && <Text c="dimmed">No supplier invoices found.</Text>}
    </Stack>
  );
}
