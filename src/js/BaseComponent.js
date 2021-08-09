import { Component } from 'preact';

export default class BaseComponent extends Component {
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
}