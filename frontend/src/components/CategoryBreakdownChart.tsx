import { BarChart } from '@mantine/charts';
import type { CategoryBreakdownPoint } from '../api/reports';
import { formatCurrency } from '../utils/format';

const BLUE = 'light-dark(#0b78b5, #0b78b5)';

export function CategoryBreakdownChart({ data }: { data: CategoryBreakdownPoint[] }) {
  const chartData = data.map((point) => ({
    category: point.category,
    Revenue: point.revenueZar,
  }));

  return (
    <BarChart
      h={Math.max(180, chartData.length * 40)}
      data={chartData}
      dataKey="category"
      series={[{ name: 'Revenue', color: BLUE }]}
      orientation="vertical"
      maxBarWidth={24}
      barProps={{ radius: [0, 4, 4, 0] }}
      gridAxis="x"
      strokeDasharray="1 0"
      withLegend={false}
      valueFormatter={(value) => formatCurrency(value)}
    />
  );
}
