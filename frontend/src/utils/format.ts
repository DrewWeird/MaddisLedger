const currencyFormatters: Record<'ZAR' | 'USD', Intl.NumberFormat> = {
  ZAR: new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
};

export function formatCurrency(value: number, currency: 'ZAR' | 'USD' = 'ZAR'): string {
  return currencyFormatters[currency].format(value);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function toDateInputValue(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}
