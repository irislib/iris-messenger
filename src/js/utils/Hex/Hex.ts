import * as bech32 from 'bech32-buffer';

import Helpers from '@/utils/Helpers.tsx';

function bech32ToHex(str: string): string {
  try {
    const { data } = bech32.decode(str);
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

    const bytesArray = this.value.match(/.{1,2}/g);
    const bytes = new Uint8Array(bytesArray!.map((byte) => parseInt(byte, 16)));
    return bech32.encode(prefix, bytes);
  }

  toHex(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }
}

export class EventID extends Hex {
  constructor(str: string) {
    if (str.startsWith('note')) {
      str = bech32ToHex(str);
    }
    super(str, 64);
  }

  toBech32(): string {
    return super.toBech32('note');
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
  constructor(str: string) {
    if (str.startsWith('npub')) {
      str = bech32ToHex(str);
    }
    super(str, 64);
  }

  toBech32(): string {
    return super.toBech32('npub');
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
