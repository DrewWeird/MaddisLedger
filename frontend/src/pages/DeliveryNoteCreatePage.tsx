import { Alert, Button, Group, NumberInput, Select, Stack, Table, Text, Textarea, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInvoice, useInvoices, useDeliverableLines } from '../api/invoices';
import { useCreateDeliveryNote } from '../api/deliveryNotes';

const schema = z.object({
  invoiceId: z.number({ message: 'Select an invoice' }),
  deliveryDate: z.date(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    invoiceLineItemId: z.number(),
    descriptionSnapshot: z.string(),
    remainingQuantity: z.number(),
    quantityDelivered: z.number().int().min(0),
  })),
});

type FormValues = z.infer<typeof schema>;

export function DeliveryNoteCreatePage() {
  const [searchParams] = useSearchParams();
  const invoiceIdFromQuery = searchParams.get('invoiceId') ? Number(searchParams.get('invoiceId')) : undefined;
  const navigate = useNavigate();

  const { data: activeInvoices } = useInvoices({ status: 'Active' });
  const createDeliveryNote = useCreateDeliveryNote();

  const { control, handleSubmit, watch, setValue, register } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { invoiceId: invoiceIdFromQuery, deliveryDate: new Date(), notes: '', lineItems: [] },
  });

  const selectedInvoiceId = watch('invoiceId');
  const { data: invoice } = useInvoice(selectedInvoiceId);
  const { data: deliverableLines } = useDeliverableLines(selectedInvoiceId);
  const { fields, replace } = useFieldArray({ control, name: 'lineItems' });
  const lineItems = watch('lineItems');

  useEffect(() => {
    if (deliverableLines) {
      replace(
        deliverableLines
          .filter((l) => l.remainingQuantity > 0)
          .map((l) => ({
            invoiceLineItemId: l.invoiceLineItemId,
            descriptionSnapshot: l.descriptionSnapshot,
            remainingQuantity: l.remainingQuantity,
            quantityDelivered: l.remainingQuantity,
          })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverableLines]);

  async function onSubmit(values: FormValues) {
    const linesToDeliver = values.lineItems.filter((l) => l.quantityDelivered > 0);
    if (linesToDeliver.length === 0) {
      notifications.show({ message: 'Set a quantity greater than zero for at least one line', color: 'red' });
      return;
    }
    try {
      const note = await createDeliveryNote.mutateAsync({
        invoiceId: values.invoiceId,
        deliveryDate: values.deliveryDate.toISOString(),
        notes: values.notes || undefined,
        lineItems: linesToDeliver.map((l) => ({ invoiceLineItemId: l.invoiceLineItemId, quantityDelivered: l.quantityDelivered })),
      });
      notifications.show({ message: `Delivery note ${note.deliveryNoteNumber} created`, color: 'green' });
      navigate(`/delivery-notes/${note.id}`);
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  return (
    <Stack>
      <Title order={2}>New Delivery Note</Title>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <Controller
            name="invoiceId"
            control={control}
            render={({ field }) => (
              <Select
                label="Invoice"
                placeholder="Select an active invoice..."
                searchable
                data={(activeInvoices ?? []).map((i) => ({ value: String(i.id), label: `${i.invoiceNumber} — ${i.customerNameSnapshot}` }))}
                value={field.value ? String(field.value) : null}
                onChange={(v) => {
                  field.onChange(v ? Number(v) : undefined);
                  setValue('lineItems', []);
                }}
                disabled={!!invoiceIdFromQuery}
              />
            )}
          />

          {invoice && (
            <Text size="sm" c="dimmed">Customer: {invoice.customerNameSnapshot}</Text>
          )}

          <Controller
            name="deliveryDate"
            control={control}
            render={({ field }) => (
              <DateInput label="Delivery Date" value={field.value} onChange={(v) => field.onChange(v ? new Date(v) : new Date())} valueFormat="DD/MM/YYYY" />
            )}
          />

          <Textarea label="Notes" {...register('notes')} autosize minRows={2} />

          {selectedInvoiceId && fields.length === 0 && (
            <Alert color="blue">Every line on this invoice has already been fully delivered.</Alert>
          )}

          {fields.length > 0 && (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Description</Table.Th>
                  <Table.Th w={140}>Remaining</Table.Th>
                  <Table.Th w={140}>Deliver Now</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {fields.map((field, index) => (
                  <Table.Tr key={field.id}>
                    <Table.Td>{field.descriptionSnapshot}</Table.Td>
                    <Table.Td>{lineItems[index]?.remainingQuantity}</Table.Td>
                    <Table.Td>
                      <Controller
                        name={`lineItems.${index}.quantityDelivered`}
                        control={control}
                        render={({ field: qtyField }) => (
                          <NumberInput
                            min={0}
                            max={lineItems[index]?.remainingQuantity}
                            value={qtyField.value}
                            onChange={(v) => qtyField.onChange(Number(v) || 0)}
                          />
                        )}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={createDeliveryNote.isPending} disabled={!selectedInvoiceId || fields.length === 0}>
              Create Delivery Note
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
