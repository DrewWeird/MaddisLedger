import { useState } from 'react';
import { Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useLedgerSummary } from '../api/reports';
import { formatCurrency } from '../utils/format';

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

export function ReportsPage() {
  const [from, setFrom] = useState<Date>(startOfMonth(new Date()));
  const [to, setTo] = useState<Date>(endOfMonth(new Date()));

  const { data: summary, isLoading } = useLedgerSummary(from.toISOString(), to.toISOString());

  return (
    <Stack>
      <Title order={2}>Reports</Title>
      <Text c="dimmed" size="sm">
        A simple income vs. expenses summary for the selected period. Revenue and expenses are recognized on their
        issue date, not on payment date.
      </Text>

      <Group>
        <DateInput label="From" value={from} onChange={(v) => v && setFrom(new Date(v))} valueFormat="DD/MM/YYYY" />
        <DateInput label="To" value={to} onChange={(v) => v && setTo(new Date(v))} valueFormat="DD/MM/YYYY" />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">Revenue ({summary?.invoiceCount ?? 0} invoices)</Text>
          <Text size="xl" fw={700}>{summary && !isLoading ? formatCurrency(summary.totalRevenueZar) : '—'}</Text>
        </Card>
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">Cost of Goods Sold</Text>
          <Text size="xl" fw={700}>{summary && !isLoading ? formatCurrency(summary.totalCostOfGoodsSoldZar) : '—'}</Text>
        </Card>
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">Gross Profit</Text>
          <Text size="xl" fw={700}>{summary && !isLoading ? formatCurrency(summary.grossProfitZar) : '—'}</Text>
        </Card>
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">Other Expenses ({summary?.supplierInvoiceCount ?? 0} supplier invoices)</Text>
          <Text size="xl" fw={700}>{summary && !isLoading ? formatCurrency(summary.totalOtherExpensesZar) : '—'}</Text>
        </Card>
        <Card withBorder padding="lg" style={{ gridColumn: 'span 2' }}>
          <Text size="sm" c="dimmed">Net Profit</Text>
          <Text size="xl" fw={700} c={summary && summary.netProfitZar < 0 ? 'red' : 'green'}>
            {summary && !isLoading ? formatCurrency(summary.netProfitZar) : '—'}
          </Text>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
