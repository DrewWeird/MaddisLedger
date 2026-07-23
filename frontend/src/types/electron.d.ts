export {};

declare global {
  interface Window {
    maddisLedger?: {
      appVersion: string;
    };
  }
}
