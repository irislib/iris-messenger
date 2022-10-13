declare type Peer = {
    url?: string;
    enabled?: boolean;
    from?: string;
    visibility?: string;
};
declare type Peers = {
    [key: string]: Peer;
};
declare const _default: {
    known: Peers;
    /** */
    add(peer: Peer): Promise<void>;
    /** */
    remove(url: string): void;
    /** */
    disconnect(peerFromGun: any): void;
    save(): void;
    getSaved(): any;
    /** */
    reset(): void;
    /** */
    connect(url: string): void;
    /** */
    disable(url: string, peerFromGun: any): void;
    isMixedContent(url: string): boolean;
    random(): any[];
    checkGunPeerCount(): void;
    init(): void;
};
/**
 * Networking and peer management utilities
 */
export default _default;
