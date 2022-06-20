export {};

declare global {
  interface Window {
    clipboardData: any;
    chrome: any;
    safari: any;
  }
}
