import { useState } from 'react';
import { Button, Group, Modal, NumberInput, Select, Stack, Textarea, TextInput, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useCreateSupplier, useSuppliers } from '../api/suppliers';
import { useCreateSupplierInvoice } from '../api/supplierInvoices';

const schema = z.object({
  supplierId: z.number({ message: 'Select a supplier' }),
  supplierReference: z.string().min(1, "The supplier's invoice/reference number is required"),
  issueDate: z.date(),
  total: z.number().min(0.01, 'Must be greater than zero'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const supplierQuickAddSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});
type SupplierQuickAddValues = z.infer<typeof supplierQuickAddSchema>;

export function SupplierInvoiceCreatePage() {
  const navigate = useNavigate();
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);

  const { data: suppliers } = useSuppliers();
  const createSupplierInvoice = useCreateSupplierInvoice();
  const createSupplier = useCreateSupplier();

  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { supplierId: undefined, issueDate: new Date(), supplierReference: '', total: 0, description: '' },
  });

  const supplierForm = useForm<SupplierQuickAddValues>({
    resolver: zodResolver(supplierQuickAddSchema),
    defaultValues: { name: '', phone: '', email: '' },
  });

  async function onSubmitSupplier(values: SupplierQuickAddValues) {
    try {
      const supplier = await createSupplier.mutateAsync({
        name: values.name,
        phone: values.phone || null,
        email: values.email || null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        postalCode: null,
      });
      setValue('supplierId', supplier.id);
      setSupplierModalOpen(false);
      supplierForm.reset();
      notifications.show({ message: 'Supplier added', color: 'green' });
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      const invoice = await createSupplierInvoice.mutateAsync({
        supplierId: values.supplierId,
        supplierReference: values.supplierReference,
        issueDate: values.issueDate.toISOString(),
        total: values.total,
        description: values.description || undefined,
      });
      notifications.show({ message: `Supplier invoice recorded`, color: 'green' });
      navigate(`/supplier-invoices/${invoice.id}`);
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  return (
    <Stack maw={500}>
      <Title order={2}>New Supplier Invoice</Title>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <Group align="flex-end">
            <Controller
              name="supplierId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Supplier"
                  placeholder="Select a supplier..."
                  searchable
                  style={{ flex: 1 }}
                  data={(suppliers ?? []).map((s) => ({ value: String(s.id), label: s.name }))}
                  value={field.value ? String(field.value) : null}
                  onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  error={errors.supplierId?.message}
                />
              )}
            />
            <Button variant="default" onClick={() => setSupplierModalOpen(true)}>
              New Supplier
            </Button>
          </Group>

          <TextInput
            label="Supplier Reference"
            placeholder="The supplier's own invoice number"
            {...register('supplierReference')}
            error={errors.supplierReference?.message}
          />

          <Controller
            name="issueDate"
            control={control}
            render={({ field }) => (
              <DateInput label="Issue Date" value={field.value} onChange={(v) => field.onChange(v ? new Date(v) : new Date())} valueFormat="DD/MM/YYYY" />
            )}
          />

          <Controller
            name="total"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Total (R)"
                min={0}
                decimalScale={2}
                value={field.value}
                onChange={(v) => field.onChange(Number(v) || 0)}
                error={errors.total?.message}
              />
            )}
          />

          <Textarea label="Description" {...register('description')} autosize minRows={2} />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate('/supplier-invoices')}>Cancel</Button>
            <Button type="submit" loading={createSupplierInvoice.isPending}>Save</Button>
          </Group>
        </Stack>
      </form>

      <Modal opened={supplierModalOpen} onClose={() => setSupplierModalOpen(false)} title="New Supplier">
        <form onSubmit={supplierForm.handleSubmit(onSubmitSupplier)}>
          <Stack>
            <TextInput label="Name" {...supplierForm.register('name')} error={supplierForm.formState.errors.name?.message} />
            <TextInput label="Phone" {...supplierForm.register('phone')} />
            <TextInput label="Email" {...supplierForm.register('email')} error={supplierForm.formState.errors.email?.message} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setSupplierModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={createSupplier.isPending}>Save</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
