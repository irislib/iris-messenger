export type Unsubscribe = () => void;
export type NodeValue = {
  updatedAt: number;
  value: any;
};
export type Callback = (
  value: any, // must be serializable?
  path: string,
  updatedAt: number | undefined,
  unsubscribe: Unsubscribe,
) => void;
export abstract class Adapter {
  abstract get(path: string, callback: Callback): Unsubscribe;
  abstract set(path: string, data: NodeValue): Promise<void>;
  //abstract list(path: string, callback: Callback): Unsubscribe;
}
