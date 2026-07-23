export {};

export type UpdateStatus =
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'not-available' }
  | { status: 'downloading'; percent: number }
  | { status: 'downloaded'; version: string }
  | { status: 'error'; message: string };

declare global {
  interface Window {
    maddisLedger?: {
      appVersion: string;
      onUpdateStatus: (callback: (payload: UpdateStatus) => void) => void;
      installUpdateNow: () => Promise<void>;
      openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
