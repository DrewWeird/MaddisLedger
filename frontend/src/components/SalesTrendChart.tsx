import { AreaChart } from '@mantine/charts';
import type { SalesTrendPoint } from '../api/dashboard';
import { formatCurrency } from '../utils/format';

const BLUE = 'light-dark(#0b78b5, #0b78b5)';

export function SalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
    Sales: point.totalZar,
  }));

  return (
    <AreaChart
      h={180}
      data={chartData}
      dataKey="date"
      series={[{ name: 'Sales', color: BLUE }]}
      curveType="linear"
      strokeWidth={2}
      fillOpacity={0.1}
      withDots={false}
      gridAxis="y"
      strokeDasharray="1 0"
      withLegend={false}
      valueFormatter={(value) => formatCurrency(value)}
    />
  );
}
