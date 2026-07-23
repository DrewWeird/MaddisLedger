import { notifications } from '@mantine/notifications';

// Inside Electron, hand the actual file off to the OS's default PDF viewer via shell.openPath —
// Electron's own built-in PDF viewer is unreliable in packaged apps (confirmed: worked in dev,
// failed in the packaged Windows build). Outside Electron (plain browser dev/testing), fall back
// to opening the backend's file-serving endpoint in a new tab.
export async function openPdf(pdfPath: string | null, fallbackUrl: string): Promise<void> {
  if (window.maddisLedger?.openPath && pdfPath) {
    const result = await window.maddisLedger.openPath(pdfPath);
    if (!result.success) {
      notifications.show({ message: result.error ?? 'Failed to open the PDF.', color: 'red' });
    }
    return;
  }

  window.open(fallbackUrl, '_blank');
}
