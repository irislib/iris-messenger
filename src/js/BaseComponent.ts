/* eslint-disable @typescript-eslint/no-explicit-any */
import { PureComponent } from "preact/compat";

import { Callback, Unsubscribe } from "./LocalState";

type OwnState = {
  ogImageUrl?: any;
};

export default abstract class BaseComponent<
  Props = any,
  State = any
> extends PureComponent<Props, State & OwnState> {
  unmounted?: boolean;

  // TODO: make this use Subscriptions instead of LocalState eventlisteners? or both?
  unsubscribes: Record<string, Unsubscribe | undefined> = {};

  sub(callback: CallableFunction, path?: string): Callback {
    const cb = (data, key, unsubscribe, f): void => {
      if (this.unmounted) {
        unsubscribe?.();
        return;
      }
      this.unsubscribes[path ?? key] = unsubscribe;
      callback(data, key, unsubscribe, f);
    };

    return cb as any;
  }

  inject(name?: string, path?: string): Callback {
    return this.sub((v: unknown, k: string) => {
      const newState: any = {};
      newState[(name ?? k) as keyof State] = v as any;
      this.setState(newState);
    }, path);
  }

  unsubscribe() {
    Object.keys(this.unsubscribes).forEach((k) => {
      const unsub = this.unsubscribes[k];
      unsub?.();
      delete this.unsubscribes[k];
    });
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.unsubscribe();
  }
}
