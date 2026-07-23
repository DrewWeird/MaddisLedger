import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { useCreateStockItem, useStockItems, useUpdateStockItem } from '../api/stockItems';
import type { StockItem } from '../api/types';
import { formatCurrency } from '../utils/format';

const schema = z.object({
  code: z.string().min(1, 'Code is required'),
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required'),
  size: z.string().optional(),
  unitPrice: z.number().min(0, 'Must be 0 or more'),
  costPrice: z.number().min(0, 'Must be 0 or more'),
  quantityOnHand: z.number().int('Must be a whole number'),
  quantityOnOrder: z.number().int('Must be a whole number').min(0),
  reorderLevel: z.number().int('Must be a whole number').min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// e.g. Category "Chutney" + Name "Appelkoos" + Size "500g" -> "CHUT-APPE-500"
function computeSuggestedCode(category: string, name: string, size: string): string {
  const parts = [category.trim().slice(0, 4), name.trim().slice(0, 4)];
  if (size.trim()) parts.push(size.trim().slice(0, 3));
  return parts.filter(Boolean).join('-').toUpperCase();
}

const EMPTY_VALUES: FormValues = {
  code: '',
  category: '',
  name: '',
  size: '',
  unitPrice: 0,
  costPrice: 0,
  quantityOnHand: 0,
  quantityOnOrder: 0,
  reorderLevel: 0,
  isActive: true,
};

export function StockPage() {
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  const { data: items, isLoading } = useStockItems({ search: search || undefined });
  const createMutation = useCreateStockItem();
  const updateMutation = useUpdateStockItem();

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  const category = watch('category');
  const name = watch('name');
  const size = watch('size');

  // Live-fills Code from Category/Name/Size while creating a new item, until the user types into
  // Code directly — at which point their edit takes over and stops being overwritten.
  useEffect(() => {
    if (!editingItem && !codeManuallyEdited) {
      setValue('code', computeSuggestedCode(category, name, size ?? ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, name, size, editingItem, codeManuallyEdited]);

  function openCreateModal() {
    setEditingItem(null);
    setCodeManuallyEdited(false);
    reset(EMPTY_VALUES);
    setModalOpen(true);
  }

  function openEditModal(item: StockItem) {
    setEditingItem(item);
    setCodeManuallyEdited(true);
    reset({ ...item, size: item.size ?? '' });
    setModalOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const dto = { ...values, size: values.size || null };
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto });
        notifications.show({ message: 'Stock item updated', color: 'green' });
      } else {
        await createMutation.mutateAsync(dto);
        notifications.show({ message: 'Stock item created', color: 'green' });
      }
      setModalOpen(false);
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Stock</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
          Add Item
        </Button>
      </Group>

      <TextInput
        placeholder="Search by name, code, or category..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Category</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Size</Table.Th>
            <Table.Th>Code</Table.Th>
            <Table.Th>Price</Table.Th>
            <Table.Th>Cost</Table.Th>
            <Table.Th>Margin</Table.Th>
            <Table.Th>On Hand</Table.Th>
            <Table.Th>On Order</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items?.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>{item.category}</Table.Td>
              <Table.Td>{item.name}</Table.Td>
              <Table.Td>{item.size ?? '—'}</Table.Td>
              <Table.Td>{item.code}</Table.Td>
              <Table.Td>{formatCurrency(item.unitPrice)}</Table.Td>
              <Table.Td>{formatCurrency(item.costPrice)}</Table.Td>
              <Table.Td>{formatCurrency(item.unitPrice - item.costPrice)}</Table.Td>
              <Table.Td>
                <Text c={item.quantityOnHand <= item.reorderLevel ? 'red' : undefined}>
                  {item.quantityOnHand}
                </Text>
              </Table.Td>
              <Table.Td>{item.quantityOnOrder}</Table.Td>
              <Table.Td>
                <Badge color={item.isActive ? 'green' : 'gray'}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
              </Table.Td>
              <Table.Td>
                <Button size="xs" variant="subtle" onClick={() => openEditModal(item)}>
                  Edit
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {!isLoading && items?.length === 0 && <Text c="dimmed">No stock items found.</Text>}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Stock Item' : 'Add Stock Item'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput label="Category" placeholder="e.g. Chutney" {...register('category')} error={errors.category?.message} />
            <TextInput label="Name" placeholder="e.g. Appelkoos" {...register('name')} error={errors.name?.message} />
            <TextInput label="Size (optional)" placeholder="e.g. 500g" {...register('size')} error={errors.size?.message} />
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextInput
                  label="Code"
                  description="Auto-filled from Category/Name/Size — edit freely to override"
                  placeholder="e.g. CHUT-APPE-500"
                  value={field.value}
                  onChange={(e) => {
                    setCodeManuallyEdited(true);
                    field.onChange(e.currentTarget.value.toUpperCase());
                  }}
                  error={errors.code?.message}
                />
              )}
            />
            <Controller
              name="unitPrice"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Unit Price (R)"
                  min={0}
                  decimalScale={2}
                  value={field.value}
                  onChange={(value) => field.onChange(Number(value) || 0)}
                  error={errors.unitPrice?.message}
                />
              )}
            />
            <Controller
              name="costPrice"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Cost Price (R)"
                  description="What this item costs to make/procure — never shown to customers"
                  min={0}
                  decimalScale={2}
                  value={field.value}
                  onChange={(value) => field.onChange(Number(value) || 0)}
                  error={errors.costPrice?.message}
                />
              )}
            />
            <Controller
              name="quantityOnHand"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Quantity On Hand"
                  value={field.value}
                  onChange={(value) => field.onChange(Number(value) || 0)}
                  error={errors.quantityOnHand?.message}
                />
              )}
            />
            <Controller
              name="quantityOnOrder"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Quantity On Order"
                  min={0}
                  value={field.value}
                  onChange={(value) => field.onChange(Number(value) || 0)}
                  error={errors.quantityOnOrder?.message}
                />
              )}
            />
            <Controller
              name="reorderLevel"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Reorder Level"
                  min={0}
                  value={field.value}
                  onChange={(value) => field.onChange(Number(value) || 0)}
                  error={errors.reorderLevel?.message}
                />
              )}
            />
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch label="Active" checked={field.value} onChange={(e) => field.onChange(e.currentTarget.checked)} />
              )}
            />
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
