declare type MyEventListener = {
    off: Function;
};
/**
  Our very own implementation of the Gun API
 */
export default class Node {
    id: string;
    parent: Node | null;
    children: Map<string, Node>;
    on_subscriptions: Map<any, any>;
    map_subscriptions: Map<any, any>;
    value: any;
    counter: number;
    loaded: boolean;
    /** */
    constructor(id?: string, parent?: Node | null);
    saveLocalForage: () => void;
    loadLocalForage: () => void;
    doCallbacks: () => void;
    /**
     *
     * @param key
     * @returns {Node}
     * @example node.get('users').get('alice').put({name: 'Alice'})
     */
    get(key: any): Node;
    /**
     * Set a value to the node. If the value is an object, it will be converted to child nodes.
     * @param value
     * @example node.get('users').get('alice').put({name: 'Alice'})
     */
    put(value: any): void;
    /**
     * Return a value without subscribing to it
     * @param callback
     * @param event
     * @param returnIfUndefined
     * @returns {Promise<*>}
     */
    once(callback?: Function, event?: MyEventListener, returnIfUndefined?: boolean): Promise<any>;
    /**
     * Subscribe to a value
     * @param callback
     */
    on(callback: Function): void;
    /**
     * Subscribe to the children of a node. Callback is called separately for each child.
     * @param callback
     * @returns {Promise<void>}
     */
    map(callback: Function): Promise<void>;
}
export {};
