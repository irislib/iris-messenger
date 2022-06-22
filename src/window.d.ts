import { State } from './js/State';
export {};

declare global {
  interface Window {
    clipboardData: any;
    chrome: any;
    safari: any;
    State: State;
  }
}
