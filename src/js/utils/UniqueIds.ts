// should this be a class instead? convert all strings to internal representation, enable comparison
export type UID = number;

// save space by mapping strs to internal unique ids
export class UniqueIds {
  static strToUniqueId = new Map<string, UID>();
  static uniqueIdToStr = new Map<UID, string>();
  static currentUniqueId = 0;

  static id(str: string): UID {
    if (str.startsWith('npub')) {
      throw new Error('use hex instead of npub ' + str);
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
}

export const STR = UniqueIds.str;
export const ID = UniqueIds.id;
