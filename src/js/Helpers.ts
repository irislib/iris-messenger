import {translate as t} from './translations/Translation';
import $ from 'jquery';
import _ from 'lodash';
import iris from 'iris-lib';
import { route } from 'preact-router';

const emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]+/ug;
const pubKeyRegex = /\B\@[\w-_]{20,50}\.[\w-_]{20,50}\b/g;

function setImgSrc(el: JQuery<HTMLElement>, src: string): JQuery<HTMLElement> {
  if (src && src.indexOf('data:image') === 0) {
    el.attr('src', src);
  }
  return el;
}

const userAgent = navigator.userAgent.toLowerCase();
const isElectron = (userAgent.indexOf(' electron/') > -1);

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

  highlightHashtags(s: string): string {
    return s.replace(/\B\#\w\w+\b/g, match => `<a href="/hashtag/${match.replace('#', '')}">${match}</a>`);
  },

  highlightEmoji(s: string): string {
    return s.replace(emojiRegex, '<span class="emoji">$&</span>');
  },

  highlightMentions(s: string): string {
    return s.replace(pubKeyRegex, match => {
      const user = match.slice(1);
      return `<a href="/profile/${user}">@<iris-text user="${user}" path="profile/name" /></a>`;
    });
  },

  followChatLink(str) {
    if (str && str.indexOf('http') === 0) {
      const s = str.split('?');
      let chatId;
      if (s.length === 2) {
        chatId = iris.util.getUrlParameter('chatWith', s[1]) || util.getUrlParameter('channelId', s[1]);
      }
      if (chatId) {
        iris.Session.newChannel(chatId, str);
        route(`/chat/${  chatId}`); // TODO
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
      window.clipboardData.setData("Text", text);
      return true;
    }
    else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
      let textarea = document.createElement("textarea");
      textarea.textContent = text;
      textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand("copy");  // Security exception may be thrown by some browsers.
      }
      catch (ex) {
        console.warn("Copy to clipboard failed.", ex);
        return false;
      }
      finally {
        document.body.removeChild(textarea);
        return true;
      }
    }
  },

  getUrlParameter(sParam: string, sParams?: string) {
    let sPageURL = sParams ?? window.location.search.substring(1),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
    }
  },

  showConsoleWarning(): void {
    let i = "Stop!",
          j = "This is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or \"hack\" someone's account, it is a scam and will give them access to your account.";

    if ((window.chrome || window.safari)) {
      let l = 'font-family:helvetica; font-size:20px; ';
      [
         [i, `${l  }font-size:50px; font-weight:bold; color:red; -webkit-text-stroke:1px black;`],
         [j, l],
         ['', '']
      ].map((r) => {
          setTimeout(console.log.bind(console, `\n%c${  r[0]}`, r[1]));
      });
    }
  },

  getRelativeTimeText(date: Date): string {
    let text = date && iris.util.getDaySeparatorText(date, date.toLocaleDateString(undefined, {dateStyle:'short'}));
    text = t(text);
    if (text === t('today')) { text = iris.util.formatTime(date); }
    return text;
  },

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))  } ${  sizes[i]}`;
  },

  download(filename: string, data: string, type: string, charset: string, href: string): void {
    let hiddenElement;
    if (charset === null) {
      charset = 'utf-8';
    }
    hiddenElement = document.createElement('a');
    hiddenElement.href = href || (`data:${type};charset=${charset},${encodeURI(data)}`);
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.click();
  },

  getBase64(file: Blob): Promise<string | ArrayBuffer | null> {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    return new Promise((resolve, reject) => {
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function (error) {
        reject(`Error: ${  error}`);
      };
    });
  },

  scrollToMessageListBottom: _.throttle(() => {
    if ($('#message-view')[0]) {
      $('#message-view').scrollTop($('#message-view')[0].scrollHeight - $('#message-view')[0].clientHeight);
    }
  }, 100),

  setImgSrc,

  animateScrollTop: (selector: string): void => {
    const el = $(selector);
    el.css({overflow:'hidden'});
    setTimeout(() => {
      el.css({overflow:''});
      el.on("scroll mousedown wheel DOMMouseScroll mousewheel keyup touchstart", e => {
        if (e.which && e.which > 0 || e.type === "mousedown" || e.type === "mousewheel" || e.type === 'touchstart') {
          el.stop(true);
        }
      });
      el.stop().animate({ scrollTop: 0 }, {duration: 400, queue: false, always: () => {
        el.off("scroll mousedown wheel DOMMouseScroll mousewheel keyup touchstart");
      }});
    }, 10);
  },

  getProfileLink(pub: string): string {
    return `${window.location.origin}/#/profile/${encodeURIComponent(pub)}`;
  },

  isElectron,
  pubKeyRegex
};
