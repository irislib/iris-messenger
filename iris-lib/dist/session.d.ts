import Channel from './Channel';
declare const _default: {
    /**
     * Log in with a key from localStorage.
     *
     * If no key is found and options.autologin is not false, a new user will be created.
     *
     * If options.autofollow is not false, the default follow will be added.
     * @param options
     */
    init(options?: any): void;
    DEFAULT_SETTINGS: {
        electron: {
            openAtLogin: boolean;
            minimizeOnClose: boolean;
        };
        local: {
            enableWebtorrent: boolean;
            enablePublicPeerDiscovery: boolean;
            autoplayWebtorrent: boolean;
            maxConnectedPeers: number;
        };
    };
    DEFAULT_FOLLOW: string;
    taskQueue: any[];
    updateSearchIndex: () => void;
    saveSearchResult: () => void;
    addFollow(callback: Function, k: string, followDistance: number, follower?: string | undefined): void;
    removeFollow(k: string, followDistance: number, follower: string): void;
    getExtendedFollows(callback: Function, k?: any, maxDepth?: number, currentDepth?: number): any;
    updateNoFollows: () => void;
    updateNoFollowers: () => void;
    getSearchIndex(): any;
    setOurOnlineStatus(): void;
    updateGroups(): void;
    /**
     * Log in with a private key.
     * @param key
     */
    login(k: any): void;
    /**
     * Create a new user account and log in.
     * @param options {Object} - Options for the new account.
     * @returns {Promise<*>}
     */
    loginAsNewUser(options?: any): any;
    /**
     * Log out the current user.
     * @returns {Promise<void>}
     */
    logOut(): Promise<void>;
    clearIndexedDB(): Promise<unknown>;
    getMyChatLink(): string;
    /**
     * Get the keypair of the logged in user.
     * @returns {*}
     */
    getKey(): any;
    /**
     * Get the public key of the logged in user.
     * @returns {*}
     */
    getPubKey(): any;
    /**
     * Get the name of the logged in user.
     * @returns {*}
     */
    getMyName(): string;
    myPeerUrl: (ip: string) => string;
    shareMyPeerUrl(channel: Channel): Promise<void>;
    newChannel(pub: string, chatLink?: string | undefined): Channel | undefined;
    addChannel(chat: Channel): void;
    processMessage(chatId: string, msg: any, info: any, onClickNotification?: Function | undefined): void;
    subscribeToMsgs(pub: any): void;
    /**
     * Known private channels with other users
     */
    channelIds: Set<unknown>;
};
/**
 * User session management utilities.
 */
export default _default;
