declare class Attribute {
    constructor(a: any, b: any);
    static getUuid(): Attribute;
    static getUniqueIdValidators(): {
        email: RegExp;
        bitcoin: RegExp;
        bitcoin_address: RegExp;
        ip: RegExp;
        ipv6: RegExp;
        gpg_fingerprint: null;
        gpg_keyid: null;
        google_oauth2: null;
        tel: RegExp;
        phone: RegExp;
        keyID: null;
        url: RegExp;
        account: RegExp;
        uuid: RegExp;
    };
    static isUniqueType(type: any): boolean;
    isUniqueType(): boolean;
    static guessTypeOf(value: any): string | undefined;
    static equals(a: any, b: any): any;
    equals(a: any): boolean;
    uri(): string;
}
export default Attribute;
