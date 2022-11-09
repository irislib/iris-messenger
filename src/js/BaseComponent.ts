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

  isUserAgentCrawler() {
    // return true; // for testing
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.indexOf('prerender') !== -1 ||
      ua.indexOf('whatsapp') !== -1 ||
      ua.indexOf('crawl') !== -1 ||
      ua.indexOf('bot') !== -1
    );
  }

  async setOgImageUrl(imgSrc?: string) {
    if (imgSrc && this.isUserAgentCrawler()) {
      const image = new Image();
      image.onload = async () => {
        const resizedCanvas = document.createElement('canvas');
        const MAX_DIMENSION = 350;
        const ratio = Math.max(image.width, image.height) / MAX_DIMENSION;
        resizedCanvas.width = image.width / ratio;
        resizedCanvas.height = image.height / ratio;
        const { default: pica } = await import('./lib/pica.min');
        await pica().resize(image, resizedCanvas);
        const ogImage = resizedCanvas.toDataURL('image/jpeg', 0.1);
        const ogImageUrl = `https://iris-base64-decoder.herokuapp.com/?s=${encodeURIComponent(
          ogImage,
        )}`;
        console.log(ogImageUrl);
        this.state.ogImageUrl;
        this.setState({ ogImageUrl });
      };
      image.src = imgSrc;
    }
  }
}
