declare type Event = {
    off: () => void;
};
/**
 * Aggregates public data from all users in the group.
 *
 * For example, the public message feed, message replies and likes are aggregated using this.
 * @param groupName
 * @returns object
 */
export default function (groupName?: string): {
    get(path: string, callback: any): void;
    _cached_map(cached: Map<string, any> | undefined, cacheKey: string, path: string, myEvent: Event, callback: Function): void;
    _cached_on(cached: Map<string, any> | undefined, cacheKey: string, path: string, myEvent: Event, callback: Function): void;
    _cached_count(cached: Map<string, any> | undefined, cacheKey: string, path: string, myEvent: Event, callback: Function): void;
    _cached_fn(fn: string, path: string, callback: Function): void;
    map(path: string, callback: Function): void;
    on(path: string, callback: Function): void;
    count(path: string, callback: Function): void;
};
export {};
