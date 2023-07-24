import { sha256 as hash } from "@noble/hashes/sha256";
import {bytesToHex} from '@noble/hashes/utils';

export const utf8Decoder = new TextDecoder('utf-8');
export const utf8Encoder = new TextEncoder();

export function sha256(data: string): string {
    let eventHash = hash(utf8Encoder.encode(data));
    return bytesToHex(eventHash);
  }