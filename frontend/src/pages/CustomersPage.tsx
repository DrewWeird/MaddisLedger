import { useState } from 'react';
import { Button, Group, Modal, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { useCreateCustomer, useCustomers, useUpdateCustomer } from '../api/customers';
import type { Customer } from '../api/types';

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

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: customers, isLoading } = useCustomers({ search: search || undefined });
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  function openCreateModal() {
    setEditingCustomer(null);
    reset(EMPTY_VALUES);
    setModalOpen(true);
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      addressLine1: customer.addressLine1 ?? '',
      addressLine2: customer.addressLine2 ?? '',
      city: customer.city ?? '',
      postalCode: customer.postalCode ?? '',
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
      if (editingCustomer) {
        await updateMutation.mutateAsync({ id: editingCustomer.id, dto });
        notifications.show({ message: 'Customer updated', color: 'green' });
      } else {
        await createMutation.mutateAsync(dto);
        notifications.show({ message: 'Customer created', color: 'green' });
      }
      setModalOpen(false);
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Customers</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
          Add Customer
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
          {customers?.map((customer) => (
            <Table.Tr key={customer.id}>
              <Table.Td>{customer.name}</Table.Td>
              <Table.Td>{customer.phone ?? '—'}</Table.Td>
              <Table.Td>{customer.email ?? '—'}</Table.Td>
              <Table.Td>{customer.city ?? '—'}</Table.Td>
              <Table.Td>
                <Button size="xs" variant="subtle" onClick={() => openEditModal(customer)}>
                  Edit
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {!isLoading && customers?.length === 0 && <Text c="dimmed">No customers found.</Text>}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add Customer'}>
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
