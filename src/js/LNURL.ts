import { Event } from './lib/nostr-tools';
import Helpers from './Helpers';

// Code kindly contributed by @Kieran from Snort

const PayServiceTag = 'payRequest';

export enum LNURLErrorCode {
  ServiceUnavailable = 1,
  InvalidLNURL = 2,
}

export class LNURLError extends Error {
  code: LNURLErrorCode;

  constructor(code: LNURLErrorCode, msg: string) {
    super(msg);
    this.code = code;
  }
}

export class LNURL {
  #url: URL;
  #service?: LNURLService;

  /**
   * Setup LNURL service
   * @param lnurl bech32 lnurl / lightning address / https url
   */
  constructor(lnurl: string) {
    lnurl = lnurl.toLowerCase().trim();
    if (lnurl.startsWith('lnurl')) {
      const decoded = Helpers.bech32ToText(lnurl);
      if (!decoded.startsWith('http')) {
        throw new LNURLError(LNURLErrorCode.InvalidLNURL, 'Not a url');
      }
      this.#url = new URL(decoded);
    } else if (lnurl.match(/[\w.-]+@[\w.-]/)) {
      const [handle, domain] = lnurl.split('@');
      this.#url = new URL(`https://${domain}/.well-known/lnurlp/${handle}`);
    } else if (lnurl.startsWith('https:')) {
      this.#url = new URL(lnurl);
    } else if (lnurl.startsWith('lnurlp:')) {
      const tmp = new URL(lnurl);
      tmp.protocol = 'https:';
      this.#url = tmp;
    } else {
      throw new LNURLError(LNURLErrorCode.InvalidLNURL, 'Could not determine service url');
    }
  }

  async load() {
    const rsp = await fetch(this.#url.toString());
    if (rsp.ok) {
      this.#service = await rsp.json();
      this.#validateService();
    }
  }

  /**
   * Fetch an invoice from the LNURL service
   * @param amount Amount in sats
   * @param comment
   * @param zap
   * @returns
   */
  async getInvoice(amount: number, comment?: string, zap?: Event) {
    const callback = new URL(Helpers.unwrap(this.#service?.callback));
    const query = new Map<string, string>();

    if (callback.search.length > 0) {
      callback.search
        .slice(1)
        .split('&')
        .forEach((a) => {
          const pSplit = a.split('=');
          query.set(pSplit[0], pSplit[1]);
        });
    }
    query.set('amount', Math.floor(amount * 1000).toString());
    if (comment && this.#service?.commentAllowed) {
      query.set('comment', comment);
    }
    if (this.#service?.nostrPubkey && zap) {
      query.set('nostr', JSON.stringify(zap)); // zap.ToObject() ?
    }

    const baseUrl = `${callback.protocol}//${callback.host}${callback.pathname}`;
    const queryJoined = [...query.entries()]
      .map((v) => `${v[0]}=${encodeURIComponent(v[1])}`)
      .join('&');
    try {
      const rsp = await fetch(`${baseUrl}?${queryJoined}`);
      if (rsp.ok) {
        const data: LNURLInvoice = await rsp.json();
        console.debug('[LNURL]: ', data);
        if (data.status === 'ERROR') {
          throw new Error(data.reason);
        } else {
          return data;
        }
      } else {
        throw new LNURLError(
          LNURLErrorCode.ServiceUnavailable,
          `Failed to fetch invoice (${rsp.statusText})`,
        );
      }
    } catch (e) {
      throw new LNURLError(LNURLErrorCode.ServiceUnavailable, 'Failed to load callback');
    }
  }

  /**
   * Are zaps (NIP-57) supported
   */
  get canZap() {
    return this.#service?.nostrPubkey ? true : false;
  }

  /**
   * Return pubkey of zap service
   */
  get zapperPubkey() {
    return this.#service?.nostrPubkey;
  }

  /**
   * Get the max allowed comment length
   */
  get maxCommentLength() {
    return this.#service?.commentAllowed ?? 0;
  }

  /**
   * Min sendable in milli-sats
   */
  get min() {
    return this.#service?.minSendable ?? 1_000; // 1 sat
  }

  /**
   * Max sendable in milli-sats
   */
  get max() {
    return this.#service?.maxSendable ?? 100e9; // 1 BTC in milli-sats
  }

  #validateService() {
    if (this.#service?.tag !== PayServiceTag) {
      throw new LNURLError(LNURLErrorCode.InvalidLNURL, 'Only LNURLp is supported');
    }
    if (!this.#service?.callback) {
      throw new LNURLError(LNURLErrorCode.InvalidLNURL, 'No callback url');
    }
  }
}

export interface LNURLService {
  tag: string;
  nostrPubkey?: string;
  minSendable?: number;
  maxSendable?: number;
  metadata: string;
  callback: string;
  commentAllowed?: number;
}

export interface LNURLStatus {
  status: 'SUCCESS' | 'ERROR';
  reason?: string;
}

export interface LNURLInvoice extends LNURLStatus {
  pr?: string;
  successAction?: LNURLSuccessAction;
}

export interface LNURLSuccessAction {
  description?: string;
  url?: string;
}
