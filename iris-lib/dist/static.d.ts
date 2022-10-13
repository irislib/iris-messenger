declare const _default: {
    /**
     * Get a file identified by its hash
     * @param hash
     * @param callback
     * @returns {Promise<unknown>}
     */
    get(hash: string, callback: Function): Promise<unknown>;
    /**
     * Store a file and return its hash
     * @param value
     * @returns {Promise<string>}
     */
    put(value: any): Promise<any>;
};
/**
 * Content-addressed storage
 */
export default _default;
