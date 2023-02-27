/* eslint-disable @typescript-eslint/no-explicit-any */
import { PureComponent } from 'react';

import { Callback, EventListener } from './LocalState';

type OwnState = {
  ogImageUrl?: any;
};

export default abstract class BaseComponent<Props = any, State = any> extends PureComponent<
  Props,
  State & OwnState
> {
  unmounted?: boolean;

  eventListeners: Record<string, EventListener | undefined> = {};

  sub(callback: CallableFunction, path?: string): Callback {
    const cb = (data, key, message, eventListener, f): void => {
      if (this.unmounted) {
        eventListener && eventListener.off();
        return;
      }
      this.eventListeners[path ?? key] = eventListener;
      callback(data, key, message, eventListener, f);
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
    Object.keys(this.eventListeners).forEach((k) => {
      const l = this.eventListeners[k];
      l && l.off();
      delete this.eventListeners[k];
    });
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.unsubscribe();
  }
}
