import { PureComponent } from 'preact/compat';

export default class BaseComponent extends PureComponent {
  eventListeners = {};

  sub(callback, path) {
    return (v,k,x,e,f) => {
      if (this.unmounted) {
        e && e.off();
        return;
      }
      this.eventListeners[path || k] = e;
      callback(v,k,x,e,f);
    }
  }

  inject(name, path) {
    return this.sub((v,k) => {
      const newState = {};
      newState[name || k] = v;
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

  async setOgImageUrl(imgSrc) {
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