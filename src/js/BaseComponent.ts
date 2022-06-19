import { PureComponent } from 'preact/compat';

type EL = {
  off: Function;
}

export default abstract class BaseComponent extends PureComponent {
  unmounted?: boolean;

  eventListeners: Record<string, EL | undefined> = {};

  sub(callback: Function, path?: string) {
    return (v: unknown, k: string, x: unknown, e: EL | undefined, f: unknown) => {
      if (this.unmounted) {
        e && e.off();
        return;
      }
      this.eventListeners[path ?? k] = e;
      callback(v,k,x,e,f);
    }
  }

  inject(name?: string, path?: string) {
    return this.sub((v: unknown, k: string) => {
      const newState: Record<string, unknown> = {};
      newState[name ?? k] = v;
      this.setState(newState);
    }, path);
  }

  componentWillUnmount() {
    this.unmounted = true;
    Object.keys(this.eventListeners).forEach(k => {
      const l = this.eventListeners[k];
      l && l.off();
      delete this.eventListeners[k];
    });
  }

  isUserAgentCrawler() {
    // return true; // for testing
    const ua = navigator.userAgent.toLowerCase();
    return (ua.indexOf('prerender') !== -1 ||
      ua.indexOf('whatsapp') !== -1 ||
      ua.indexOf('crawl') !== -1 ||
      ua.indexOf('bot') !== -1);
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
        const ogImageUrl = `https://iris-base64-decoder.herokuapp.com/?s=${encodeURIComponent(ogImage)}`;
        console.log(ogImageUrl);
        this.setState({ogImageUrl});
      };
      image.src = imgSrc;
    }
  }
}
