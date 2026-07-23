import { useState } from 'react';
import { Alert, Card, Group, SegmentedControl, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useDashboardSummary, useLowStockItems, useSalesTrend } from '../api/dashboard';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { formatCurrency } from '../utils/format';

export function DashboardPage() {
  const [trendDays, setTrendDays] = useState('7');
  const { data: summary } = useDashboardSummary();
  const { data: lowStock } = useLowStockItems();
  const { data: salesTrend } = useSalesTrend(Number(trendDays));

  return (
    <Stack>
      <Title order={2}>Dashboard</Title>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">Invoices Today</Text>
          <Text size="xl" fw={700}>{summary?.invoiceCountToday ?? '—'}</Text>
        </Card>
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">Sales Today</Text>
          <Text size="xl" fw={700}>{summary ? formatCurrency(summary.invoiceTotalToday) : '—'}</Text>
        </Card>
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">Low Stock Items</Text>
          <Text size="xl" fw={700}>{summary?.lowStockItemCount ?? '—'}</Text>
        </Card>
      </SimpleGrid>

      <Card withBorder padding="lg">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Sales Trend</Title>
          <SegmentedControl
            size="xs"
            value={trendDays}
            onChange={setTrendDays}
            data={[{ label: '7 days', value: '7' }, { label: '30 days', value: '30' }]}
          />
        </Group>
        {salesTrend && <SalesTrendChart data={salesTrend} />}
      </Card>

      {lowStock && lowStock.length > 0 && (
        <Card withBorder padding="lg">
          <Group mb="sm">
            <IconAlertTriangle color="var(--mantine-color-red-6)" size={20} />
            <Title order={4}>Low Stock</Title>
          </Group>
          <Alert color="orange" variant="light" mb="sm">
            These items are at or below their reorder level.
          </Alert>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Category</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>On Hand</Table.Th>
                <Table.Th>Reorder Level</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lowStock.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.category}</Table.Td>
                  <Table.Td>{item.name}</Table.Td>
                  <Table.Td>{item.size ?? '—'}</Table.Td>
                  <Table.Td>{item.quantityOnHand}</Table.Td>
                  <Table.Td>{item.reorderLevel}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}
