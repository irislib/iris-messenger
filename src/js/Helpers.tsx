/* eslint-disable @typescript-eslint/no-explicit-any */
import reactStringReplace from 'react-string-replace';
import { sha256 } from '@noble/hashes/sha256';
import iris from 'iris-lib';
import $ from 'jquery';
import throttle from 'lodash/throttle';
import { route } from 'preact-router';

import Name from './components/Name';
import PublicMessage from './components/PublicMessage';
import { isSafeOrigin } from './components/SafeImg';
import Torrent from './components/Torrent';
import { language, translate as t } from './translations/Translation';
import Nostr from './Nostr';

const emojiRegex =
  /([\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]+)/gu;
const pubKeyRegex = /(?:^|\s)(?:@)?(npub[a-zA-Z0-9]{59,60})(?![\w/])/g;
const noteRegex = /(?:^|\s)(?:@)?(note[a-zA-Z0-9]{59,60})(?![\w/])/g;

let settings: any = {};
iris
  .local()
  .get('settings')
  .on((s) => (settings = s));

function setImgSrc(el: JQuery<HTMLElement>, src: string): JQuery<HTMLElement> {
  if (src) {
    // parse src as url safely
    src = new URL(src).href;
    if (!isSafeOrigin(src)) {
      src = `https://proxy.irismessengers.wtf/insecure/plain/${src}`;
    }
    el.attr('src', src);
  }
  return el;
}

const userAgent = navigator.userAgent.toLowerCase();
const isElectron = userAgent.indexOf(' electron/') > -1;

export default {
  wtClient: undefined as any,

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
    const res = await fetch('https://translate.irismessengers.wtf/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'auto',
        target: language.split('-')[0],
        format: 'text',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    return res.json();
  },

  generateName(seed: string) {
    if (!seed) {
      throw new Error('No seed provided');
    }
    // deterministically create adjective + animal names using iris.util.adjectives and iris.util.animals
    const hash = sha256(seed); // Uint8Array
    const adjective = iris.util.adjectives[hash[0] % iris.util.adjectives.length];
    const animal = iris.util.animals[hash[1] % iris.util.animals.length];
    return `${this.capitalize(adjective)} ${this.capitalize(animal)}`;
  },

  highlightEverything(s: string, event?: any): any[] {
    let replacedText = reactStringReplace(s, emojiRegex, (match, i) => {
      return (
        <span key={match + i} className="emoji">
          {match}
        </span>
      );
    });
    replacedText = reactStringReplace(replacedText, pubKeyRegex, (match, i) => {
      const link = `/${match}`;
      return (
        <>
          {' '}
          <a href={link}>
            @<Name key={match + i} pub={match} hideBadge={true} userNameOnly={true} />
          </a>
        </>
      );
    });

    replacedText = reactStringReplace(replacedText, noteRegex, (match, i) => {
      return (
        <PublicMessage
          key={match + i}
          hash={Nostr.toNostrHexAddress(match)}
          showName={true}
          showBtns={false}
          asInlineQuote={true}
        />
      );
    });

    /*
    <blockquote class="twitter-tweet"><p lang="en" dir="ltr">Sunsets don&#39;t get much better than this one over <a href="https://twitter.com/GrandTetonNPS?ref_src=twsrc%5Etfw">@GrandTetonNPS</a>. <a href="https://twitter.com/hashtag/nature?src=hash&amp;ref_src=twsrc%5Etfw">#nature</a> <a href="https://twitter.com/hashtag/sunset?src=hash&amp;ref_src=twsrc%5Etfw">#sunset</a> <a href="http://t.co/YuKy2rcjyU">pic.twitter.com/YuKy2rcjyU</a></p>&mdash; US Department of the Interior (@Interior) <a href="https://twitter.com/Interior/status/463440424141459456?ref_src=twsrc%5Etfw">May 5, 2014</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
     */

    const videoRegex = /(https?:\/\/\S+\.(?:mp4|mkv|avi|flv|wmv|mov|webm))/gi;
    replacedText = reactStringReplace(replacedText, videoRegex, (match, i) => {
      return (
        <video
          key={match + i}
          src={match}
          muted={true}
          autoPlay={!iris.util.isMobile && settings.autoplayVideos !== false}
          playsInline={true}
          webkit-playsinline={true}
          controls={true}
          loop={true}
        />
      );
    });

    const audioRegex = /(https?:\/\/\S+\.(?:mp3|wav|ogg|flac))/gi;
    replacedText = reactStringReplace(replacedText, audioRegex, (match, i) => {
      return <audio key={match + i} src={match} controls={true} loop={true} />;
    });

    if (settings.enableYoutube !== false) {
      const youtubeRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})(?:\S+)?/g;
      replacedText = reactStringReplace(replacedText, youtubeRegex, (match, i) => {
        return (
          <iframe
            key={match + i}
            width="650"
            height="400"
            style={{ maxWidth: '100%' }}
            src={`https://www.youtube.com/embed/${match}`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      });
    }

    if (settings.enableInstagram !== false) {
      const igRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)((?:p|reel)\/[\w-]{11})(?:\S+)?/g;
      replacedText = reactStringReplace(replacedText, igRegex, (match, i) => {
        return (
          <iframe
            class="instagram"
            key={match + i}
            width="650"
            height="400"
            style={{ maxWidth: '100%' }}
            src={`https://instagram.com/${match}/embed`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      });
    }

    if (settings.enableSpotify !== false) {
      const spotifyRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:open\.spotify\.com\/track\/)([\w-]+)(?:\S+)?/g;
      replacedText = reactStringReplace(replacedText, spotifyRegex, (match, i) => {
        return (
          <iframe
            class="audio"
            scrolling="no"
            key={match + i}
            width="650"
            height="200"
            style={{ maxWidth: '100%' }}
            src={`https://open.spotify.com/embed/track/${match}?utm_source=oembed`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      });
    }

    if (settings.enableTidal !== false) {
      const tidalRegex = /(?:https?:\/\/)?(?:www\.)?(?:tidal\.com(?:\/browse)?\/track\/)([\d]+)?/g;
      replacedText = reactStringReplace(replacedText, tidalRegex, (match, i) => {
        return (
          <iframe
            class="audio"
            scrolling="no"
            key={match + i}
            width="650"
            height="200"
            style={{ maxWidth: '100%' }}
            src={`https://embed.tidal.com/tracks/${match}?layout=gridify`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      });
    }

    if (settings.enableTorrent !== false) {
      const magnetRegex = /(magnet:\?xt=urn:btih:.*)/gi;
      replacedText = reactStringReplace(replacedText, magnetRegex, (match, i) => {
        // Torrent component
        console.log('magnet link', match);
        return <Torrent key={match + i} preview={true} torrentId={match} />;
      });
    }

    const lnRegex =
      /(lightning:[\w.-]+@[\w.-]+|lightning:\w+\?amount=\d+|(?:lightning:)?(?:lnurl|lnbc)[\da-z0-9]+)/gi;
    replacedText = reactStringReplace(replacedText, lnRegex, (match) => {
      if (!match.startsWith('lightning:')) {
        match = `lightning:${match}`;
      }
      return <a href={match}>⚡ Pay with lightning</a>;
    });

    replacedText = this.highlightLinks(replacedText);

    if (event && event.tags) {
      // replace "#[0]" tags with links to the user: event.tags[n][1]
      replacedText = reactStringReplace(replacedText, /#\[(\d+)\]/g, (match, i) => {
        const tag = event.tags[parseInt(match, 10)];
        if (tag) {
          if (tag[0] === 'p') {
            // profile
            const link = `/${Nostr.toNostrBech32Address(tag[1], 'npub')}`;
            return (
              <a href={link}>
                @<Name key={match + i} pub={tag[1]} hideBadge={true} userNameOnly={true} />
              </a>
            );
          } else if (tag[0] === 'e') {
            // event
            return;
          }
        }
        return match;
      });
    }
    return replacedText;
  },

  highlightLinks(s: string): any[] {
    return reactStringReplace(
      s,
      /((?:https?:\/\/\S*[^.?,)\s])|(?:iris\.to\/\S*[^.?,)\s]))/gi,
      (match, i) => (
        <a key={match + i} href={match.replace(/^(https:\/\/)?iris.to/, '')}>
          {match.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </a>
      ),
    );
  },

  followChatLink(str) {
    if (str && str.indexOf('http') === 0) {
      const s = str.split('?');
      let chatId;
      if (s.length === 2) {
        chatId =
          iris.util.getUrlParameter('chatWith', s[1]) ||
          iris.util.getUrlParameter('channelId', s[1]);
      }
      if (chatId) {
        iris.session.newChannel(chatId, str);
        route(`/chat/${chatId}`); // TODO
        return true;
      }
      if (str.indexOf('https://iris.to') === 0) {
        route(str.replace('https://iris.to', '')); // TODO
        return true;
      }
    }
  },

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
  },

  getUrlParameter(sParam: string, sParams?: string) {
    const sPageURL = sParams ?? window.location.search.substring(1),
      sURLVariables = sPageURL.split('&');
    let sParameterName, i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? '' : decodeURIComponent(sParameterName[1]);
      }
    }
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

  getRelativeTimeText(date: Date): string {
    const currentTime = new Date();
    const timeDifference = Math.floor((currentTime.getTime() - date.getTime()) / 1000);
    const secondsInAMinute = 60;
    const secondsInAnHour = 60 * secondsInAMinute;
    const secondsInADay = 24 * secondsInAnHour;

    if (timeDifference < secondsInAMinute) {
      return t('now');
    } else if (timeDifference < secondsInAnHour) {
      return Math.floor(timeDifference / secondsInAMinute) + 'm';
    } else if (timeDifference < secondsInADay) {
      return Math.floor(timeDifference / secondsInAnHour) + 'h';
    } else {
      if (date.getFullYear() === currentTime.getFullYear()) {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
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

  scrollToMessageListBottom: throttle(() => {
    if ($('#message-view')[0]) {
      $('#message-view').scrollTop(
        $('#message-view')[0].scrollHeight - $('#message-view')[0].clientHeight,
      );
    }
  }, 100),

  setImgSrc,

  animateScrollTop: (selector: string): void => {
    const el = $(selector);
    el.css({ overflow: 'hidden' });
    setTimeout(() => {
      el.css({ overflow: '' });
      el.on('scroll mousedown wheel DOMMouseScroll mousewheel keyup touchstart', (e) => {
        if (
          (e.which && e.which > 0) ||
          e.type === 'mousedown' ||
          e.type === 'mousewheel' ||
          e.type === 'touchstart'
        ) {
          el.stop(true);
        }
      });
      el.stop().animate(
        { scrollTop: 0 },
        {
          duration: 400,
          queue: false,
          always: () => {
            el.off('scroll mousedown wheel DOMMouseScroll mousewheel keyup touchstart');
          },
        },
      );
    }, 10);
  },

  getProfileLink(pub: string): string {
    return `${window.location.origin}//${encodeURIComponent(pub)}`;
  },

  isElectron,
  pubKeyRegex,
};
