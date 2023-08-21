/* eslint-disable @typescript-eslint/no-explicit-any */
import { bech32 } from 'bech32';

import Key from '../nostr/Key';
import localState from '../state/LocalState.ts';
import { language } from '../translations/Translation.mjs';

const emojiRegex =
  /([\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]+)/gu;
const pubKeyRegex =
  /(?:^|\s|nostr:|(?:https?:\/\/[\w./]+)|iris\.to\/|snort\.social\/p\/|damus\.io\/)+((?:@)?npub[a-zA-Z0-9]{59,60})(?![\w/])/gi;
const noteRegex =
  /(?:^|\s|nostr:|(?:https?:\/\/[\w./]+)|iris\.to\/|snort\.social\/e\/|damus\.io\/)+((?:@)?note[a-zA-Z0-9]{59,60})(?![\w/])/gi;

const hashtagRegex = /(#[^\s!@#$%^&*()=+./,[{\]};:'"?><]+)/g;

let existingIrisToAddress: any = {};
localState.get('existingIrisToAddress').on((a) => (existingIrisToAddress = a));

const userAgent = navigator.userAgent.toLowerCase();
const isElectron = userAgent.indexOf(' electron/') > -1;

declare global {
  interface Navigator {
    standalone: any;
  }
}

export default {
  wtClient: undefined as any,

  formatAmount(amount: number, decimals = 2): string {
    if (typeof amount !== 'number') {
      return '';
    }
    if (amount < 1000) {
      return amount.toFixed(decimals);
    }
    if (amount < 1000000) {
      return (amount / 1000).toFixed(decimals) + 'K';
    }
    if (amount < 1000000000) {
      return (amount / 1000000).toFixed(decimals) + 'M';
    }
    return (amount / 1000000000).toFixed(decimals) + 'B';
  },

  isStandalone() {
    return (
      navigator.standalone ||
      window.matchMedia('(display-mode: standalone)').matches ||
      document.referrer.includes('android-app://iris.to')
    );
  },

  capitalize(s?: string): string {
    if (s === undefined) {
      return '';
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
  },

  isEmoji(s: string): boolean {
    return s.match(emojiRegex) !== null;
  },

  async translateText(text: string): Promise<string> {
    const res = await fetch('https://translate.iris.to/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'auto',
        target: language.split('-')[0],
        format: 'text',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await res.json();

    return json?.translatedText;
  },

  handleLightningLinkClick(e: Event): void {
    e.preventDefault();
    const link = ((e.target as HTMLElement).closest('A') as HTMLLinkElement).href;

    if (!link.startsWith('lightning:')) {
      return;
    }

    // disable popup for now
    /*
    let timerId = null;

    function handleBlur() {
      clearTimeout(timerId);
      window.removeEventListener('blur', handleBlur);
    }

    window.addEventListener('blur', handleBlur);

    timerId = setTimeout(() => {
      alert(t('install_lightning_wallet_prompt'));
      window.removeEventListener('blur', handleBlur);
    }, 3000);
    */

    window.open(link, '_self');
  },

  isMobile: (function () {
    let check = false;
    (function (a) {
      if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
          a,
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
          a.substr(0, 4),
        )
      )
        check = true;
    })(navigator.userAgent || navigator.vendor || '');
    return check;
  })(),

  copyToClipboard(text: string): boolean {
    if (window.clipboardData && window.clipboardData.setData) {
      // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
      window.clipboardData.setData('Text', text);
      return true;
    } else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
      const textarea = document.createElement('textarea');
      textarea.textContent = text;
      textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page in Microsoft Edge.
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand('copy'); // Security exception may be thrown by some browsers.
      } catch (ex) {
        console.warn('Copy to clipboard failed.', ex);
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
    return false;
  },

  showConsoleWarning(): void {
    const i = 'Stop!',
      j =
        'This is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or "hack" someone\'s account, it is a scam and will give them access to your account.';

    if (window.chrome || window.safari) {
      const l = 'font-family:helvetica; font-size:20px; ';
      [
        [i, `${l}font-size:50px; font-weight:bold; color:red; -webkit-text-stroke:1px black;`],
        [j, l],
        ['', ''],
      ].map((r) => {
        setTimeout(console.log.bind(console, `\n%c${r[0]}`, r[1]));
      });
    }
  },

  formatTime(date: Date) {
    const t: any = date.toLocaleTimeString(undefined, { timeStyle: 'short' });
    const s = t.split(':');
    if (s.length === 3) {
      // safari tries to display seconds
      return `${s[0]}:${s[1]}${s[2].slice(2)}`;
    }
    return t;
  },

  formatDate(date: Date) {
    const t = date.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const s = t.split(':');
    if (s.length === 3) {
      // safari tries to display seconds
      return `${s[0]}:${s[1]}${s[2].slice(2)}`;
    }
    return t;
  },

  getUrlParameter(name: string) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  setUrlParameter(name: string, value: string | null) {
    const urlParams = new URLSearchParams(window.location.search);

    if (value) {
      urlParams.set(name, value);
    } else {
      urlParams.delete(name);
    }

    // Construct the new URL.
    let newUrl = window.location.pathname;

    // Only append the ? if urlParams is not empty.
    if (urlParams.toString()) {
      newUrl += '?' + urlParams.toString();
    }

    window.history.replaceState({}, '', newUrl);
  },

  getDaySeparatorText(date: Date, dateStr: string, now?: Date, nowStr?: string) {
    if (!now) {
      now = new Date();
      nowStr = now.toLocaleDateString(undefined, { dateStyle: 'short' });
    }
    if (dateStr === nowStr) {
      return 'today';
    }
    const dayDifference = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDifference === 0) {
      return 'today';
    }
    if (dayDifference === 1) {
      return 'yesterday';
    }
    if (dayDifference <= 5) {
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    }
    return dateStr;
  },

  unwrap<T>(v: T | undefined | null): T {
    if (v === undefined || v === null) {
      throw new Error('missing value');
    }
    return v;
  },

  bech32ToText(str: string): string {
    try {
      const decoded = bech32.decode(str, 1000);
      const buf = bech32.fromWords(decoded.words);
      return new TextDecoder().decode(Uint8Array.from(buf));
    } catch (e) {
      console.error('bech32ToText failed', e);
      return '';
    }
  },

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  },

  download(filename: string, data: string, type: string, charset: string, href: string): void {
    if (charset === null) {
      charset = 'utf-8';
    }
    const hiddenElement = document.createElement('a');
    hiddenElement.href = href || `data:${type};charset=${charset},${encodeURI(data)}`;
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.click();
  },

  getBase64(file: Blob): Promise<string | ArrayBuffer | null> {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    return new Promise((resolve, reject) => {
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function (error) {
        reject(`Error: ${error}`);
      };
    });
  },

  getMyProfileLink(): string {
    const user = existingIrisToAddress.name || Key.toNostrBech32Address(Key.getPubKey(), 'npub');
    return this.buildURL(user);
  },

  buildURL(path: string, queryParams: Record<string, string> = {}, hash: string = ''): string {
    const url = new URL(window.location.origin);
    url.pathname = path;

    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.append(key, value);
    }

    if (hash) {
      url.hash = hash;
    }

    return url.toString();
  },

  arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  },

  arrayToHex(array: any) {
    return Array.from(array, (byte: any) => {
      return ('0' + (byte & 0xff).toString(16)).slice(-2);
    }).join('');
  },

  isElectron,
  pubKeyRegex,
  noteRegex,
  hashtagRegex,
};
