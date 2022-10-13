declare const _default: {
    throttle: (func: Function, limit: number) => () => void;
    debounce: (func: Function, limit: number) => () => void;
    sample: (arr: any[]) => any;
    sampleSize: (arr: any[], size: number) => any[];
    defer: (func: Function) => number;
    once: (func: Function) => () => void;
    omit: (obj: any, keys: string[]) => {};
    defaults: (obj: any, defaults: any) => any;
    pickBy: (obj: any, predicate: Function) => {};
};
export default _default;
