import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconAlertTriangle, IconPlus, IconTrash } from '@tabler/icons-react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useCreateCustomer, useCustomers } from '../api/customers';
import { useStockItems } from '../api/stockItems';
import { useCreateInvoice } from '../api/invoices';
import { StockItemPicker } from '../components/StockItemPicker';
import { formatCurrency } from '../utils/format';

const lineItemSchema = z.object({
  stockItemId: z.number({ message: 'Select an item' }),
  quantity: z.number().int().min(1, 'Must be at least 1'),
  unitPrice: z.number().min(0),
});

const schema = z.object({
  customerId: z.number({ message: 'Select a customer' }),
  issueDate: z.date(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'Add at least one line item'),
});

type FormValues = z.infer<typeof schema>;

const customerQuickAddSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});
type CustomerQuickAddValues = z.infer<typeof customerQuickAddSchema>;

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const { data: customers } = useCustomers();
  const { data: stockItems } = useStockItems({ activeOnly: true });
  const createInvoice = useCreateInvoice();
  const createCustomer = useCreateCustomer();

  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: undefined, issueDate: new Date(), notes: '', lineItems: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const lineItems = watch('lineItems');

  const customerForm = useForm<CustomerQuickAddValues>({
    resolver: zodResolver(customerQuickAddSchema),
    defaultValues: { name: '', phone: '', email: '' },
  });

  const grandTotal = lineItems.reduce((sum, line) => sum + (line.quantity || 0) * (line.unitPrice || 0), 0);

  async function onSubmitCustomer(values: CustomerQuickAddValues) {
    try {
      const customer = await createCustomer.mutateAsync({
        name: values.name,
        phone: values.phone || null,
        email: values.email || null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        postalCode: null,
      });
      setValue('customerId', customer.id);
      setCustomerModalOpen(false);
      customerForm.reset();
      notifications.show({ message: 'Customer added', color: 'green' });
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      const invoice = await createInvoice.mutateAsync({
        customerId: values.customerId,
        issueDate: values.issueDate.toISOString(),
        notes: values.notes || undefined,
        lineItems: values.lineItems.map((l) => ({
          stockItemId: l.stockItemId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      notifications.show({ message: `Invoice ${invoice.invoiceNumber} created`, color: 'green' });
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  return (
    <Stack>
      <Title order={2}>New Invoice</Title>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <Group align="flex-end">
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Customer"
                  placeholder="Select a customer..."
                  searchable
                  style={{ flex: 1 }}
                  data={(customers ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
                  value={field.value ? String(field.value) : null}
                  onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  error={errors.customerId?.message}
                />
              )}
            />
            <Button variant="default" onClick={() => setCustomerModalOpen(true)}>
              New Customer
            </Button>
          </Group>

          <Controller
            name="issueDate"
            control={control}
            render={({ field }) => (
              <DateInput label="Issue Date" value={field.value} onChange={(v) => field.onChange(v ?? new Date())} valueFormat="DD/MM/YYYY" />
            )}
          />

          <Textarea label="Notes" {...register('notes')} autosize minRows={2} />

          <Title order={4} mt="md">Line Items</Title>
          {errors.lineItems?.message && <Alert color="red">{errors.lineItems.message}</Alert>}

          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ minWidth: 280 }}>Item</Table.Th>
                <Table.Th w={100}>Quantity</Table.Th>
                <Table.Th w={140}>Unit Price</Table.Th>
                <Table.Th w={120}>Line Total</Table.Th>
                <Table.Th w={50} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {fields.map((field, index) => {
                const line = lineItems[index];
                const stockItem = stockItems?.find((s) => s.id === line?.stockItemId);
                const oversold = stockItem && line?.quantity > stockItem.quantityOnHand;

                return (
                  <Table.Tr key={field.id}>
                    <Table.Td>
                      <Controller
                        name={`lineItems.${index}.stockItemId`}
                        control={control}
                        render={({ field: pickerField }) => (
                          <StockItemPicker
                            value={pickerField.value ?? null}
                            onChange={(item) => {
                              pickerField.onChange(item?.id ?? undefined);
                              if (item) setValue(`lineItems.${index}.unitPrice`, item.unitPrice);
                            }}
                            error={errors.lineItems?.[index]?.stockItemId?.message}
                          />
                        )}
                      />
                      {oversold && (
                        <Text size="xs" c="orange" mt={4}>
                          <IconAlertTriangle size={12} style={{ verticalAlign: 'middle' }} /> Only {stockItem!.quantityOnHand} in stock
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Controller
                        name={`lineItems.${index}.quantity`}
                        control={control}
                        render={({ field: qtyField }) => (
                          <NumberInput min={1} value={qtyField.value} onChange={(v) => qtyField.onChange(Number(v) || 1)} />
                        )}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Controller
                        name={`lineItems.${index}.unitPrice`}
                        control={control}
                        render={({ field: priceField }) => (
                          <NumberInput min={0} decimalScale={2} value={priceField.value} onChange={(v) => priceField.onChange(Number(v) || 0)} />
                        )}
                      />
                    </Table.Td>
                    <Table.Td>{formatCurrency((line?.quantity || 0) * (line?.unitPrice || 0))}</Table.Td>
                    <Table.Td>
                      <ActionIcon color="red" variant="subtle" onClick={() => remove(index)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => append({ stockItemId: undefined as unknown as number, quantity: 1, unitPrice: 0 })}
          >
            Add Line
          </Button>

          <Group justify="flex-end">
            <Title order={3}>Total: {formatCurrency(grandTotal)}</Title>
          </Group>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate('/invoices')}>Cancel</Button>
            <Button type="submit" loading={createInvoice.isPending}>Create Invoice</Button>
          </Group>
        </Stack>
      </form>

      <Modal opened={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title="New Customer">
        <form onSubmit={customerForm.handleSubmit(onSubmitCustomer)}>
          <Stack>
            <TextInput label="Name" {...customerForm.register('name')} error={customerForm.formState.errors.name?.message} />
            <TextInput label="Phone" {...customerForm.register('phone')} />
            <TextInput label="Email" {...customerForm.register('email')} error={customerForm.formState.errors.email?.message} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setCustomerModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={createCustomer.isPending}>Save</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
