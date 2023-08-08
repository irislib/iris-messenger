import Key from './Key';

// should this be a class instead? convert all strings to internal representation, enable comparison
export type UserId = number;

// save space by mapping pubkeys to internal user ids
export class UserIds {
  static pubKeyToUserId = new Map<string, number>();
  static UserIdToPubKey = new Map<number, string>();
  static currentUserId = 0;

  static id(pubKey: string): number {
    if (pubKey.startsWith('npub') || pubKey.startsWith('note')) {
      pubKey = Key.toNostrHexAddress(pubKey) || '';
      if (!pubKey) {
        throw new Error('addFollower: invalid pubKey ' + pubKey);
      }
    }
    const existing = UserIds.pubKeyToUserId.get(pubKey);
    if (existing) {
      return existing;
    }
    const newId = UserIds.currentUserId++;
    UserIds.pubKeyToUserId.set(pubKey, newId);
    UserIds.UserIdToPubKey.set(newId, pubKey);
    return newId;
  }

  static pub(id: number): string {
    const pub = UserIds.UserIdToPubKey.get(id);
    if (!pub) {
      throw new Error('pub: invalid id ' + id);
    }
    return pub;
  }

  static bech32(id: number): string {
    return Key.toNostrBech32Address(UserIds.pub(id), 'npub') || '';
  }

  static has(pubKey: string): boolean {
    return UserIds.pubKeyToUserId.has(pubKey);
  }
}

export const PUB = UserIds.pub;
export const BECH32 = UserIds.bech32;
export const ID = UserIds.id;
