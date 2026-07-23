import { Select } from '@mantine/core';
import { useStockItems } from '../api/stockItems';
import type { StockItem } from '../api/types';
import { formatCurrency } from '../utils/format';

interface StockItemPickerProps {
  value: number | null;
  onChange: (item: StockItem | null) => void;
  error?: string;
}

export function StockItemPicker({ value, onChange, error }: StockItemPickerProps) {
  const { data: items } = useStockItems({ activeOnly: true });

  const options = (items ?? []).map((item) => ({
    value: String(item.id),
    label: `${item.category} - ${item.name}${item.size ? ` (${item.size})` : ''} — ${formatCurrency(item.unitPrice)} [${item.quantityOnHand} in stock]`,
  }));

  return (
    <Select
      placeholder="Select a stock item..."
      searchable
      data={options}
      value={value ? String(value) : null}
      error={error}
      onChange={(selected) => {
        if (!selected) {
          onChange(null);
          return;
        }
        const item = items?.find((i) => i.id === Number(selected)) ?? null;
        onChange(item);
      }}
    />
  );
}
