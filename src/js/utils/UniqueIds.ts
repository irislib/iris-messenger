import Key from "@/nostr/Key";

// should this be a class instead? convert all strings to internal representation, enable comparison
export type UID = number;


// save space by mapping strs to internal unique ids
export class UniqueIds {
  static strToUniqueId = new Map<string, UID>();
  static uniqueIdToStr = new Map<UID, string>();
  static currentUniqueId = 0;

  static id(str: string): UID {
    if(!str) throw new Error('ID(str) is undefined');

    if (str.startsWith('npub') || str.startsWith('note') || str.startsWith('nsec')) {
      str = Key.toNostrHexAddress(str) as string; // Convert to hex
      if(!str) throw new Error('ID(str) is invalid or empty');
    }

    const existing = UniqueIds.strToUniqueId.get(str);
    if (existing) {
      return existing;
    }
    const newId = UniqueIds.currentUniqueId++;
    UniqueIds.strToUniqueId.set(str, newId);
    UniqueIds.uniqueIdToStr.set(newId, str);
    return newId;
  }

  static str(id: UID): string {
    const pub = UniqueIds.uniqueIdToStr.get(id);
    if (!pub) {
      throw new Error('pub: invalid id ' + id);
    }
    return pub;
  }

  static has(str: string): boolean {
    return UniqueIds.strToUniqueId.has(str);
  }

  static bech32(id: number, prefix: string = 'npub'): string {
    return Key.toNostrBech32Address(UniqueIds.str(id), prefix) || '';
  }

}

export const STR = UniqueIds.str;
export const ID = UniqueIds.id;
export const BECH32 = UniqueIds.bech32;
