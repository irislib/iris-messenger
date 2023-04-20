/* eslint-disable prettier/prettier */
export {};

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    clipboardData: any;
    chrome: any;
    safari: any;
  }
}


declare module '*.png' {
  const content: string;
  export default content;
}
