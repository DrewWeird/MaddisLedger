import { useState } from 'react';
import { Card, Group, SegmentedControl, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useCategoryBreakdown, useLedgerSummary, useLedgerTrend } from '../api/reports';
import { LedgerTrendChart } from '../components/LedgerTrendChart';
import { CategoryBreakdownChart } from '../components/CategoryBreakdownChart';
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
  const [bucket, setBucket] = useState<'week' | 'month'>('week');

  const { data: summary, isLoading } = useLedgerSummary(from.toISOString(), to.toISOString());
  const { data: trend } = useLedgerTrend(from.toISOString(), to.toISOString(), bucket);
  const { data: categoryBreakdown } = useCategoryBreakdown(from.toISOString(), to.toISOString());

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

      <Card withBorder padding="lg">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Revenue, Cost &amp; Expenses Trend</Title>
          <SegmentedControl
            size="xs"
            value={bucket}
            onChange={(v) => setBucket(v as 'week' | 'month')}
            data={[{ label: 'Weekly', value: 'week' }, { label: 'Monthly', value: 'month' }]}
          />
        </Group>
        {trend && trend.length > 0 ? (
          <LedgerTrendChart data={trend} />
        ) : (
          <Text c="dimmed" size="sm">No activity in this period.</Text>
        )}
      </Card>

      <Card withBorder padding="lg">
        <Title order={4} mb="sm">Revenue by Category</Title>
        {categoryBreakdown && categoryBreakdown.length > 0 ? (
          <CategoryBreakdownChart data={categoryBreakdown} />
        ) : (
          <Text c="dimmed" size="sm">No sales in this period.</Text>
        )}
      </Card>
    </Stack>
  );
}
