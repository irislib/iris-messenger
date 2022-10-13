import 'gun/sea';
declare class Key {
    static getActiveKey(datadir?: string, keyfile?: string, fs?: any): Promise<any>;
    static getDefault(datadir?: string, keyfile?: string): Promise<any>;
    static getActivePub(datadir?: string, keyfile?: string): Promise<any>;
    static setActiveKey(key: any, save: boolean | undefined, datadir: string | undefined, keyfile: string | undefined, fs: any): void;
    static toString(key: any): string;
    static getId(key: any): any;
    static fromString(str: string): any;
    static generate(): any;
    static sign(msg: any, pair: any): Promise<string>;
    static verify(msg: any, pubKey: any): any;
}
export default Key;
