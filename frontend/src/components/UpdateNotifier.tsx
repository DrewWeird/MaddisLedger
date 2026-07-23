import { useEffect } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

const NOTIFICATION_ID = 'app-update';

// Silent by default: electron-updater only shows a native OS toast once a download finishes.
// This surfaces every stage (checking/downloading/ready/error) as an in-app notification so an
// update in progress — or a failed check — is never invisible to the user.
export function UpdateNotifier() {
  useEffect(() => {
    if (!window.maddisLedger?.onUpdateStatus) return;

    window.maddisLedger.onUpdateStatus((payload) => {
      switch (payload.status) {
        case 'available':
          notifications.show({
            id: NOTIFICATION_ID,
            title: 'Update available',
            message: `Downloading version ${payload.version}...`,
            loading: true,
            autoClose: false,
          });
          break;
        case 'downloading':
          notifications.update({
            id: NOTIFICATION_ID,
            title: 'Update available',
            message: `Downloading... ${payload.percent}%`,
            loading: true,
            autoClose: false,
          });
          break;
        case 'downloaded':
          notifications.update({
            id: NOTIFICATION_ID,
            title: 'Update ready',
            message: (
              <Stack gap={6}>
                <Text size="sm">Version {payload.version} will install the next time you quit MaddisLedger.</Text>
                <Button size="xs" onClick={() => window.maddisLedger?.installUpdateNow()}>
                  Restart Now
                </Button>
              </Stack>
            ),
            color: 'green',
            loading: false,
            autoClose: false,
          });
          break;
        case 'error':
          notifications.update({
            id: NOTIFICATION_ID,
            title: 'Update check failed',
            message: payload.message,
            color: 'red',
            loading: false,
            autoClose: 6000,
          });
          break;
        // 'checking' and 'not-available' are logged on the main process side only — no need to
        // interrupt the user on every launch just to say nothing happened.
      }
    });
  }, []);

  return null;
}
