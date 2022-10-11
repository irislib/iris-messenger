// @ts-nocheck
export default {
  throttle: (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  debounce: (func: Function, limit: number) => {
    let inDebounce: boolean;
    return function() {
      const args = arguments;
      const context = this;
      clearTimeout(inDebounce);
      inDebounce = setTimeout(() => func.apply(context, args), limit);
    };
  },
  sample: (arr: any[]) => arr[Math.floor(Math.random() * arr.length)],
  sampleSize: (arr: any[], size: number) => {
    const shuffled = arr.slice(0);
    let i = arr.length;
    let min = i - size;
    let temp;
    let index;
    while (i-- > min) {
      index = Math.floor((i + 1) * Math.random());
      temp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = temp;
    }
    return shuffled.slice(min);
  },
  defer: (func: Function) => setTimeout(func, 0),
  once: (func: Function) => {
    let called = false;
    return function() {
      if (called) {
        return;
      }
      called = true;
      func.apply(this, arguments);
    };
  },
  omit: (obj: any, keys: string[]) => {
    const newObj = {};
    Object.keys(obj).forEach(key => {
      if (!keys.includes(key)) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  },
  defaults: (obj: any, defaults: any) => {
    Object.keys(defaults).forEach(key => {
      if (obj[key] === undefined) {
        obj[key] = defaults[key];
      }
    });
    return obj;
  },
  pickBy: (obj: any, predicate: Function) => {
    const newObj = {};
    Object.keys(obj).forEach(key => {
      if (predicate(obj[key])) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  }
}