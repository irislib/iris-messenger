/* eslint-disable @typescript-eslint/no-explicit-any */
import { PureComponent } from 'react';
import type { GunCallbackOn, GunSchema, IGunOnEvent } from 'gun';

type EL = IGunOnEvent;

type OwnState = {
  ogImageUrl?: any;
};

export default abstract class BaseComponent<Props = any, State = any> extends PureComponent<
  Props,
  State & OwnState
> {
  unmounted?: boolean;

  eventListeners: Record<string, EL | undefined> = {};

  sub(callback: CallableFunction, path?: string): GunCallbackOn<GunSchema, string> {
    const cb = (data, key, message, event, f): void => {
      if (this.unmounted) {
        event && event.off();
        return;
      }
      this.eventListeners[path ?? key] = event;
      callback(data, key, message, event, f);
    };

    return cb as any;
  }

  inject(name?: string, path?: string): GunCallbackOn<GunSchema, string> {
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
