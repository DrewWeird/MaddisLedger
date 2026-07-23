import { BarChart } from '@mantine/charts';
import type { LedgerTrendPoint } from '../api/reports';
import { formatCurrency } from '../utils/format';

// Validated categorical triple (see the dataviz skill's palette validator) derived from
// Maddi's Sweet Temptations' logo colors. Dark-mode orange is a separate, darker step of
// the same hue — the light-mode brand orange is too light for the dark chart surface.
const REVENUE_COLOR = 'light-dark(#0b78b5, #0b78b5)';
const COGS_COLOR = 'light-dark(#e1760a, #c98500)';
const EXPENSES_COLOR = 'light-dark(#d6000d, #d6000d)';

export function LedgerTrendChart({ data }: { data: LedgerTrendPoint[] }) {
  const chartData = data.map((point) => ({
    period: point.periodLabel,
    Revenue: point.revenueZar,
    'Cost of Goods Sold': point.costOfGoodsSoldZar,
    'Other Expenses': point.otherExpensesZar,
  }));

  return (
    <BarChart
      h={260}
      data={chartData}
      dataKey="period"
      series={[
        { name: 'Revenue', color: REVENUE_COLOR },
        { name: 'Cost of Goods Sold', color: COGS_COLOR },
        { name: 'Other Expenses', color: EXPENSES_COLOR },
      ]}
      maxBarWidth={24}
      barProps={{ radius: [4, 4, 0, 0] }}
      gridAxis="y"
      strokeDasharray="1 0"
      withLegend
      valueFormatter={(value) => formatCurrency(value)}
    />
  );
}
