export type Unsubscribe = () => void;
export type NodeValue = {
  updatedAt: number;
  value: any;
};
export type Callback = (
  value: any,
  path: string,
  updatedAt: number,
  unsubscribe: Unsubscribe,
) => void;
export abstract class Adapter {
  abstract get(path: string, callback: Callback): Unsubscribe;
  abstract set(path: string, data: NodeValue): void;
}
