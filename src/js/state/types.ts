export type Unsubscribe = () => void;
export type Callback = (data: any, path: string, unsubscribe: Unsubscribe) => void;
export abstract class Adapter {
  abstract get(path: string, callback: Callback): Unsubscribe;
  abstract set(path: string, data: any): void;
}
