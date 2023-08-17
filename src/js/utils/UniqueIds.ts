import Key from '../nostr/Key.ts';

// should this be a class instead? convert all strings to internal representation, enable comparison
export type UID = number;

// save space by mapping strs to internal unique ids
export class UniqueIds {
  static strToUniqueId = new Map<string, UID>();
  static UniqueIdTostr = new Map<UID, string>();
  static currentUniqueId = 0;

  static id(str: string): UID {
    if (str.startsWith('npub')) {
      str = Key.toNostrHexAddress(str) || '';
      if (!str) {
        throw new Error('str->id: invalid str ' + str);
      }
    }
    const existing = UniqueIds.strToUniqueId.get(str);
    if (existing) {
      return existing;
    }
    const newId = UniqueIds.currentUniqueId++;
    UniqueIds.strToUniqueId.set(str, newId);
    UniqueIds.UniqueIdTostr.set(newId, str);
    return newId;
  }

  static pub(id: UID): string {
    const pub = UniqueIds.UniqueIdTostr.get(id);
    if (!pub) {
      throw new Error('pub: invalid id ' + id);
    }
    return pub;
  }

  static has(str: string): boolean {
    return UniqueIds.strToUniqueId.has(str);
  }
}

export const PUB = UniqueIds.pub;
export const ID = UniqueIds.id;
