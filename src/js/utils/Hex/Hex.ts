import { hexToBytes } from '@noble/hashes/utils';
import { bech32 } from 'bech32';

import Helpers from '@/utils/Helpers.tsx';

function bech32ToHex(str: string): string {
  try {
    const { words } = bech32.decode(str);
    const data = new Uint8Array(bech32.fromWords(words));
    const addr = Helpers.arrayToHex(data);

    return addr;
  } catch (e) {
    throw new Error('The provided string is not a valid bech32 address: ' + str);
  }
}

export class Hex {
  value: string;

  constructor(str: string, expectedLength?: number) {
    // maybe should accept bech32 input and convert to hex?
    this.validateHex(str, expectedLength);
    this.value = str;
  }

  private validateHex(str: string, expectedLength?: number): void {
    if (!/^[0-9a-fA-F]+$/.test(str)) {
      throw new Error(`The provided string is not a valid hex value: "${str}"`);
    }

    if (expectedLength && str.length !== expectedLength) {
      throw new Error(
        `The provided hex value does not match the expected length of ${expectedLength} characters: ${str}`,
      );
    }
  }

  toBech32(prefix: string): string {
    if (!prefix) {
      throw new Error('prefix is required');
    }

    const data = hexToBytes(this.value);
    const words = bech32.toWords(data);
    return bech32.encode(prefix, words);
  }

  get hex(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }
}

export class EventID extends Hex {
  noteValue: string | undefined;

  constructor(str: string) {
    const isNote = str.startsWith('note');
    let hexValue = str;
    if (isNote) {
      hexValue = bech32ToHex(str);
    }
    super(hexValue, 64);
    if (isNote) {
      this.noteValue = str; // preserve the original Bech32 value
    }
  }

  get note(): string {
    if (!this.noteValue) {
      this.noteValue = super.toBech32('note');
    }
    return this.noteValue;
  }

  equals(other: EventID | string): boolean {
    if (typeof other === 'string') {
      if (other === this.value) {
        return true;
      }
      other = new EventID(other);
    }
    return this.value === other.value;
  }
}

export class PublicKey extends Hex {
  npubValue: string | undefined;

  constructor(str: string) {
    const isNpub = str.startsWith('npub');
    let hexValue = str;
    if (isNpub) {
      hexValue = bech32ToHex(str);
    }
    super(hexValue, 64);
    if (isNpub) {
      this.npubValue = str; // preserve the original Bech32 value
    }
  }

  get npub(): string {
    if (!this.npubValue) {
      this.npubValue = super.toBech32('npub');
    }
    return this.npubValue;
  }

  equals(other: PublicKey | string): boolean {
    if (typeof other === 'string') {
      if (other === this.value) {
        return true;
      }
      other = new PublicKey(other);
    }
    return this.value === other.value;
  }
}
