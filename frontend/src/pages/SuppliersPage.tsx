import { useState } from 'react';
import { Button, Group, Modal, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { useCreateSupplier, useSuppliers, useUpdateSupplier } from '../api/suppliers';
import type { Supplier } from '../api/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  name: '', phone: '', email: '', addressLine1: '', addressLine2: '', city: '', postalCode: '',
};

export function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: suppliers, isLoading } = useSuppliers({ search: search || undefined });
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  function openCreateModal() {
    setEditingSupplier(null);
    reset(EMPTY_VALUES);
    setModalOpen(true);
  }

  function openEditModal(supplier: Supplier) {
    setEditingSupplier(supplier);
    reset({
      name: supplier.name,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      addressLine1: supplier.addressLine1 ?? '',
      addressLine2: supplier.addressLine2 ?? '',
      city: supplier.city ?? '',
      postalCode: supplier.postalCode ?? '',
    });
    setModalOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const dto = {
      name: values.name,
      phone: values.phone || null,
      email: values.email || null,
      addressLine1: values.addressLine1 || null,
      addressLine2: values.addressLine2 || null,
      city: values.city || null,
      postalCode: values.postalCode || null,
    };
    try {
      if (editingSupplier) {
        await updateMutation.mutateAsync({ id: editingSupplier.id, dto });
        notifications.show({ message: 'Supplier updated', color: 'green' });
      } else {
        await createMutation.mutateAsync(dto);
        notifications.show({ message: 'Supplier created', color: 'green' });
      }
      setModalOpen(false);
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Suppliers</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
          Add Supplier
        </Button>
      </Group>

      <TextInput
        placeholder="Search by name, phone, or email..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Phone</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>City</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {suppliers?.map((supplier) => (
            <Table.Tr key={supplier.id}>
              <Table.Td>{supplier.name}</Table.Td>
              <Table.Td>{supplier.phone ?? '—'}</Table.Td>
              <Table.Td>{supplier.email ?? '—'}</Table.Td>
              <Table.Td>{supplier.city ?? '—'}</Table.Td>
              <Table.Td>
                <Button size="xs" variant="subtle" onClick={() => openEditModal(supplier)}>
                  Edit
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {!isLoading && suppliers?.length === 0 && <Text c="dimmed">No suppliers found.</Text>}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput label="Name" {...register('name')} error={errors.name?.message} />
            <TextInput label="Phone" {...register('phone')} error={errors.phone?.message} />
            <TextInput label="Email" {...register('email')} error={errors.email?.message} />
            <TextInput label="Address Line 1" {...register('addressLine1')} />
            <TextInput label="Address Line 2" {...register('addressLine2')} />
            <TextInput label="City" {...register('city')} />
            <TextInput label="Postal Code" {...register('postalCode')} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
