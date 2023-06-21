/* eslint-disable @typescript-eslint/no-explicit-any */
import reactStringReplace from 'react-string-replace';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { bech32 } from 'bech32';
import $ from 'jquery';
import throttle from 'lodash/throttle';
import { nip19 } from 'nostr-tools';
import { route } from 'preact-router';

import EventComponent from './components/events/EventComponent';
import Name from './components/Name';
import SafeImg from './components/SafeImg';
import Torrent from './components/Torrent';
import Key from './nostr/Key';
import { language, translate as t } from './translations/Translation.mjs';
import localState from './LocalState';

const emojiRegex =
  /([\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]+)/gu;
const pubKeyRegex =
  /(?:^|\s|nostr:|(?:https?:\/\/[\w./]+)|iris\.to\/|snort\.social\/p\/|damus\.io\/)+((?:@)?npub[a-zA-Z0-9]{59,60})(?![\w/])/gi;
const noteRegex =
  /(?:^|\s|nostr:|(?:https?:\/\/[\w./]+)|iris\.to\/|snort\.social\/e\/|damus\.io\/)+((?:@)?note[a-zA-Z0-9]{59,60})(?![\w/])/gi;
const nip19Regex = /\bnostr:(n(?:event|profile)1\w+)\b/g;

const hashtagRegex = /(#\w+)/g;

let settings: any = {};
localState.get('settings').on((s) => (settings = s));
let existingIrisToAddress: any = {};
localState.get('settings').put({}); // ?
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

  highlightEverything(s: string, event?: any, opts: any = { showMentionedMessages: true }): any[] {
    let replacedText = reactStringReplace(s, emojiRegex, (match, i) => {
      return (
        <span key={match + i} className="emoji">
          {match}
        </span>
      );
    });

    if (opts.showMentionedMessages) {
      replacedText = reactStringReplace(replacedText, noteRegex, (match, i) => {
        return (
          <EventComponent
            key={match + i}
            id={Key.toNostrHexAddress(match) || ''}
            asInlineQuote={true}
          />
        );
      });
    }

    if (settings.enableTwitter !== false) {
      const twitterRegex = /(?:^|\s)(?:@)?(https?:\/\/twitter.com\/\w+\/status\/\d+\S*)(?![\w/])/g;
      replacedText = reactStringReplace(replacedText, twitterRegex, (match, i) => {
        return (
          <iframe
            style={{
              'max-width': '350px',
              height: '450px',
              'background-color': 'white',
              display: 'block',
            }}
            key={match + i}
            scrolling="no"
            height={250}
            width={550}
            src={`https://twitframe.com/show?url=${encodeURIComponent(match)}`}
          />
        );
      });
    }

    if (settings.enableVideos !== false) {
      const videoRegex = /(https?:\/\/\S+\.(?:mp4|mkv|avi|flv|wmv|mov|webm))\b/gi;
      replacedText = reactStringReplace(replacedText, videoRegex, (match, i) => {
        return (
          <video
            className="my-2 rounded max-h-[70vh] md:max-h-96 max-w-full"
            key={match + i}
            src={match}
            poster={`https://imgproxy.iris.to/thumbnail/428/${match}`}
            muted={!this.isMobile && settings.autoplayVideos !== false}
            autoPlay={!this.isMobile && settings.autoplayVideos !== false}
            playsInline
            controls
            loop
            onLoadedData={(e) => {
              if (!this.isMobile && settings.autoplayVideos) {
                (e.target as HTMLVideoElement).play();
              }
            }}
          />
        );
      });
    }

    if (settings.enableAudio !== false) {
      const audioRegex = /(https?:\/\/\S+\.(?:mp3|wav|ogg|flac))\b/gi;
      replacedText = reactStringReplace(replacedText, audioRegex, (match, i) => {
        return <audio key={match + i} src={match} controls={true} loop={true} />;
      });
    }

    if (settings.enableYoutube !== false) {
      const youtubeRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})(?:\S+)?/g;
      replacedText = reactStringReplace(replacedText, youtubeRegex, (match, i) => {
        return (
          <iframe
            key={match + i}
            width="650"
            height="400"
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

    // Soundcloud
    if (settings.enableSoundCloud !== false) {
      const soundCloudRegex =
        /(?:https?:\/\/)?(?:www\.)?(soundcloud\.com\/(?!live)[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+)(?:\?.*)?/g;
      replacedText = reactStringReplace(replacedText, soundCloudRegex, (match, i) => {
        return (
          console.log('match: ' + match),
          console.log('match 0: ' + match[0]),
          console.log('match 1: ' + match[1]),
          console.log('match 2: ' + match[2]),
          (
            <iframe
              class="audio"
              scrolling="no"
              key={match + i}
              width="650"
              height="380"
              style={{ maxWidth: '100%' }}
              src={`https://w.soundcloud.com/player/?url=${match}`}
              frameBorder="0"
              allow="encrypted-media"
            />
          )
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

    //spotify podcast episode
    if (settings.enableSpotify !== false) {
      const spotifyRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:open\.spotify\.com\/episode\/)([\w-]+)(?:\S+)?(?:t=(\d+))?/g;
      replacedText = reactStringReplace(replacedText, spotifyRegex, (match, i) => {
        return (
          <iframe
            class="audio"
            scrolling="no"
            key={match + i}
            width="650"
            height="200"
            style={{ maxWidth: '100%' }}
            src={`https://open.spotify.com/embed/episode/${match}`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      });
    }

    // Spotify album
    if (settings.enableSpotify !== false) {
      const spotifyRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:open\.spotify\.com\/album\/)([\w-]+)(?:\S+)?/g;
      replacedText = reactStringReplace(replacedText, spotifyRegex, (match, i) => {
        return (
          <iframe
            class="audio"
            scrolling="no"
            key={match + i}
            width="650"
            height="400"
            style={{ maxWidth: '100%' }}
            src={`https://open.spotify.com/embed/album/${match}`}
            frameBorder="0"
            allow="encrypted-media"
          />
        );
      });
    }

    // Spotify playlist
    if (settings.enableSpotify !== false) {
      const spotifyPlaylistRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:open\.spotify\.com\/playlist\/)([\w-]+)(?:\S+)?/g;
      replacedText = reactStringReplace(replacedText, spotifyPlaylistRegex, (match, i) => {
        return (
          <iframe
            class="audio"
            scrolling="no"
            key={match + i}
            width="650"
            height="380"
            style={{ maxWidth: '100%' }}
            src={`https://open.spotify.com/embed/playlist/${match}`}
            frameBorder="0"
            allow="encrypted-media"
          />
        );
      });
    }
    // Apple Music

    if (settings.enableAppleMusic !== false) {
      const appleMusicRegex = /(?:https?:\/\/)(?:.*?)(music\.apple\.com\/.*)/gi;
      replacedText = reactStringReplace(replacedText, appleMusicRegex, (match, i) => {
        return (
          <iframe
            class="applemusic"
            scrolling="no"
            key={match + i}
            width="650"
            height="150"
            style={{ maxWidth: '100%' }}
            src={`https://embed.music.apple.com/${match}`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      });
    }

    // Apple Podcast

    if (settings.enableAppleMusic !== false) {
      const applePodcastRegex = /(?:https?:\/\/)?(?:www\.)?(podcasts\.apple\.com\/.*)/g;
      replacedText = reactStringReplace(replacedText, applePodcastRegex, (match, i) => {
        console.log('embed url: ' + match);
        const cssClass = match.includes('?i=') ? 'applepodcast-small' : 'applepodcast-large';
        return (
          <iframe
            // class="applepodcast"
            class={cssClass}
            scrolling="no"
            key={match + i}
            width="650"
            height="175"
            style={{ maxWidth: '100%' }}
            src={`https://embed.${match}`}
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

    // Tiktok embed
    if (settings.enableTiktok !== false) {
      const tiktokRegex = /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/.*?video\/(\d{1,19})/g;
      replacedText = reactStringReplace(replacedText, tiktokRegex, (match, i) => {
        return (
          <iframe
            class="tiktok"
            width="605"
            height="400"
            key={match + i}
            style={{ maxWidth: '100%' }}
            src={`https://www.tiktok.com/embed/v2/${match}`}
            frameBorder="1"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      });
    }

    // twitch.com/videos
    if (settings.enableTwitch !== false) {
      const twitchRegex = /(?:https?:\/\/)?(?:www\.)?(?:twitch\.tv\/videos\/)([\d]+)?/g;
      replacedText = reactStringReplace(replacedText, twitchRegex, (match, i) => {
        return (
          <iframe
            class="video"
            scrolling="no"
            key={match + i}
            width="650"
            height="400"
            style={{ maxWidth: '100%' }}
            src={`https://player.twitch.tv/?video=${match}&parent=${window.location.hostname}&autoplay=false`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      });
    }

    // twitch channels
    if (settings.enableTwitch !== false) {
      const twitchRegex = /(?:https?:\/\/)?(?:www\.)?(?:twitch\.tv\/)([\w-]+)?/g;
      replacedText = reactStringReplace(replacedText, twitchRegex, (match, i) => {
        return (
          <iframe
            class="video"
            scrolling="no"
            key={match + i}
            width="650"
            height="400"
            style={{ maxWidth: '100%' }}
            src={`https://player.twitch.tv/?channel=${match}&parent=${window.location.hostname}&autoplay=false`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      });
    }

    // wavlake track/album/artist
    if (settings.enableWavlake !== false) {
      const wavlakeRegex =
        /https:\/\/(?:player\.)?wavlake\.com\/(?!feed\/|artists)(track\/[.a-zA-Z0-9-]+|album\/[.a-zA-Z0-9-]+|[.a-zA-Z0-9-]+)/i;
      replacedText = reactStringReplace(replacedText, wavlakeRegex, (match, i) => {
        return (
          <iframe
            key={match + i}
            height="380"
            width="100%"
            style={{ maxWidth: '100%' }}
            src={`https://embed.wavlake.com/${match}`}
            frameBorder="0"
            loading="lazy"
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

    // find .jpg .jpeg .gif .png .webp urls in msg.text and create img tag
    if (settings.enableImages !== false) {
      const imgRegex = /(https?:\/\/[^\s]*\.(?:jpg|jpeg|gif|png|webp))/gi;
      replacedText = reactStringReplace(replacedText, imgRegex, (match, i) => {
        return (
          <SafeImg
            className="my-2 md:rounded max-h-[70vh] md:max-h-96 max-w-full cursor-pointer"
            onClick={opts.onImageClick}
            src={match}
            key={match + i}
          />
        );
      });
    }

    replacedText = this.highlightText(replacedText, event, opts);

    const lnRegex =
      /(lightning:[\w.-]+@[\w.-]+|lightning:\w+\?amount=\d+|(?:lightning:)?(?:lnurl|lnbc)[\da-z0-9]+)/gi;
    replacedText = reactStringReplace(replacedText, lnRegex, (match) => {
      if (!match.startsWith('lightning:')) {
        match = `lightning:${match}`;
      }
      return (
        <a href={match} onClick={(e) => this.handleLightningLinkClick(e)}>
          ⚡ Pay with lightning
        </a>
      );
    });

    return replacedText;
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

  // hashtags, usernames, links
  highlightText(s: string, event?: any, opts: any = {}) {
    s = reactStringReplace(s, pubKeyRegex, (match, i) => {
      match = match.replace(/@/g, '');
      const link = `/${match}`;
      return (
        <>
          {' '}
          <a href={link} className="link">
            @<Name key={match + i} pub={match} hideBadge={true} />
          </a>
        </>
      );
    });

    // nip19 decode
    s = reactStringReplace(s, nip19Regex, (match, i) => {
      try {
        const { type, data } = nip19.decode(match);
        if (type === 'nprofile') {
          return (
            <>
              {' '}
              <a href={`/${data.pubkey}`} className="link">
                @<Name key={match + i} pub={data.pubkey} hideBadge={true} />
              </a>
            </>
          );
        } else if (type === 'nevent') {
          // same as note
          return <EventComponent key={match + i} id={data.id} asInlineQuote={true} />;
        }
      } catch (e) {
        console.log(e);
        return match;
      }
    });

    s = reactStringReplace(s, noteRegex, (match) => {
      match = match.replace(/@/g, '');
      const link = `/${match}`;
      return (
        <>
          {' '}
          <a href={link} className="link">
            {match}
          </a>
        </>
      );
    });

    s = reactStringReplace(
      s,
      /((?:https?:\/\/\S*[^.?,)\s])|(?:iris\.to\/\S*[^.?,)\s]))/gi,
      (match, i) => {
        const url = match.replace(/^(https:\/\/)?iris.to/, '');
        const isIris = url !== match;
        return (
          <a
            key={match + i}
            className="link"
            target="_blank"
            onClick={(e) => {
              if (isIris) {
                e.preventDefault();
                route(url);
              }
            }}
            href={url}
          >
            {match.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        );
      },
    );

    if (event?.tags) {
      // replace "#[n]" tags with links to the user: event.tags[n][1]
      s = reactStringReplace(s, /#\[(\d+)\]/g, (match, i) => {
        const tag = event.tags[parseInt(match, 10)];
        if (tag) {
          const tagTarget = tag[1].replace('@', '');
          if (tag[0] === 'p') {
            // profile
            const link = `/${Key.toNostrBech32Address(tagTarget, 'npub')}`;
            return (
              <a href={link}>
                @<Name key={tagTarget + i} pub={tagTarget} hideBadge={true} />
              </a>
            );
          } else if (tag[0] === 'e') {
            return opts.showMentionedMessages ? (
              <EventComponent key={tagTarget + i} id={tagTarget} asInlineQuote={true} />
            ) : (
              <a href={`/${Key.toNostrBech32Address(tagTarget, 'note')}`}>{tag[1]}</a>
            );
          }
        }
        return match;
      });
    }

    // highlight hashtags, link to /search/${encodeUriComponent(hashtag)}
    s = reactStringReplace(s, hashtagRegex, (match) => {
      return <a href={`/search/${encodeURIComponent(match)}`}>{match}</a>;
    });

    return s;
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
        return date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
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

  animateScrollTop: (selector?: string): void => {
    const el = selector ? $(selector) : $(window);
    el.css({ overflow: 'hidden' });
    setTimeout(() => {
      el.css({ overflow: '' });
      el.on('scroll mousedown wheel DOMMouseScroll mousewheel keyup touchstart', (e) => {
        if (
          e.which > 0 ||
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

  getMyProfileLink(): string {
    const user = existingIrisToAddress.name || Key.toNostrBech32Address(Key.getPubKey(), 'npub');
    return `${window.location.origin}/${user}`;
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
