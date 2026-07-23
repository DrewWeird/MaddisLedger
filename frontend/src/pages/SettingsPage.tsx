import { Avatar, Button, Divider, FileButton, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useBusinessProfile, useUpdateBusinessProfile, useUploadBusinessLogo } from '../api/businessProfile';

const schema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  bankName: z.string().optional(),
  bankAccountHolder: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranchCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SettingsPage() {
  const { data: profile } = useBusinessProfile();
  const updateMutation = useUpdateBusinessProfile();
  const uploadLogoMutation = useUploadBusinessLogo();
  const [logoVersion, setLogoVersion] = useState(0);

  const { register, reset, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { businessName: '' },
  });

  useEffect(() => {
    if (profile) {
      reset({
        businessName: profile.businessName,
        addressLine1: profile.addressLine1 ?? '',
        addressLine2: profile.addressLine2 ?? '',
        city: profile.city ?? '',
        postalCode: profile.postalCode ?? '',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
        bankName: profile.bankName ?? '',
        bankAccountHolder: profile.bankAccountHolder ?? '',
        bankAccountNumber: profile.bankAccountNumber ?? '',
        bankBranchCode: profile.bankBranchCode ?? '',
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await updateMutation.mutateAsync({
        businessName: values.businessName,
        addressLine1: values.addressLine1 || null,
        addressLine2: values.addressLine2 || null,
        city: values.city || null,
        postalCode: values.postalCode || null,
        phone: values.phone || null,
        email: values.email || null,
        bankName: values.bankName || null,
        bankAccountHolder: values.bankAccountHolder || null,
        bankAccountNumber: values.bankAccountNumber || null,
        bankBranchCode: values.bankBranchCode || null,
      });
      notifications.show({ message: 'Business profile updated', color: 'green' });
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  async function handleLogoUpload(file: File | null) {
    if (!file) return;
    try {
      await uploadLogoMutation.mutateAsync(file);
      setLogoVersion((v) => v + 1);
      notifications.show({ message: 'Logo updated', color: 'green' });
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' });
    }
  }

  return (
    <Stack maw={600}>
      <Title order={2}>Settings</Title>
      <Text c="dimmed" size="sm">
        These details appear on the header of every invoice and delivery note.
      </Text>

      <Group>
        <Avatar src={profile?.logoPath ? `/api/business-profile/logo?v=${logoVersion}` : undefined} size={80} radius="md" />
        <FileButton onChange={handleLogoUpload} accept="image/png,image/jpeg">
          {(props) => <Button {...props} variant="default" loading={uploadLogoMutation.isPending}>Upload Logo</Button>}
        </FileButton>
      </Group>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput label="Business Name" {...register('businessName')} error={errors.businessName?.message} />
          <TextInput label="Address Line 1" {...register('addressLine1')} />
          <TextInput label="Address Line 2" {...register('addressLine2')} />
          <TextInput label="City" {...register('city')} />
          <TextInput label="Postal Code" {...register('postalCode')} />
          <TextInput label="Phone" {...register('phone')} />
          <TextInput label="Email" {...register('email')} error={errors.email?.message} />

          <Divider label="Banking Details (EFT)" mt="md" />
          <TextInput label="Bank Name" {...register('bankName')} />
          <TextInput label="Account Holder" {...register('bankAccountHolder')} />
          <TextInput label="Account Number" {...register('bankAccountNumber')} />
          <TextInput label="Branch Code" {...register('bankBranchCode')} />

          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={updateMutation.isPending}>Save</Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
