/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    clipboardData: any;
    chrome: any;
    safari: any;
  }
}

export {};
