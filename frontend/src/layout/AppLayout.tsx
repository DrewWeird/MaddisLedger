import { AppShell, Badge, Group, NavLink, Text } from '@mantine/core';
import {
  IconChartBar,
  IconFileInvoice,
  IconLayoutDashboard,
  IconReceipt2,
  IconSettings,
  IconTruck,
  IconTruckDelivery,
  IconUsers,
  IconBox,
} from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLowStockItems } from '../api/dashboard';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard },
  { to: '/stock', label: 'Stock', icon: IconBox },
  { to: '/customers', label: 'Customers', icon: IconUsers },
  { to: '/invoices', label: 'Invoices', icon: IconFileInvoice },
  { to: '/delivery-notes', label: 'Delivery Notes', icon: IconTruckDelivery },
  { to: '/suppliers', label: 'Suppliers', icon: IconTruck },
  { to: '/supplier-invoices', label: 'Supplier Invoices', icon: IconReceipt2 },
  { to: '/reports', label: 'Reports', icon: IconChartBar },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: lowStockItems } = useLowStockItems();

  const appVersion = window.maddisLedger?.appVersion;

  return (
    <AppShell navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
      <AppShell.Navbar p="md" style={{ display: 'flex', flexDirection: 'column' }}>
        <Text fw={700} size="lg" mb="md">
          Maddi's Sweet Temptations
        </Text>
        <div style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              label={
                item.to === '/stock' && lowStockItems && lowStockItems.length > 0 ? (
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="sm">{item.label}</Text>
                    <Badge color="red" size="sm" circle>
                      {lowStockItems.length}
                    </Badge>
                  </Group>
                ) : (
                  item.label
                )
              }
              leftSection={<item.icon size={18} />}
              active={location.pathname === item.to}
              onClick={() => navigate(item.to)}
            />
          ))}
        </div>
        {appVersion && (
          <Text size="xs" c="dimmed" ta="center">
            v{appVersion}
          </Text>
        )}
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
