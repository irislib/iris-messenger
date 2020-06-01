import {gun} from './Main.js';

var emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]+/ug;

function setImgSrc(el, src) {
  if (src && src.indexOf('data:image') === 0) {
    el.attr('src', src);
  }
  return el;
}

export default {
  isUrl: s => {
    var matches = Autolinker.parse(s, {urls: true});
    return matches.length === 1 && matches[0].getUrl() === s;
  },

  isEmoji: s => {
    return s.match(emojiRegex);
  },

  highlightEmoji: s => {
    return s.replace(emojiRegex, '<span class="emoji">$&</span>');
  },

  copyToClipboard: text => {
    if (window.clipboardData && window.clipboardData.setData) {
      // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
      return window.clipboardData.setData("Text", text);
    }
    else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
      var textarea = document.createElement("textarea");
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
      }
    }
  },

  getUrlParameter: (sParam, sParams) => {
    var sPageURL = sParams || window.location.search.substring(1),
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

  showConsoleWarning: () => {
    var i = "Stop!",
          j = "This is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or \"hack\" someone's account, it is a scam and will give them access to your account.";

    if ((window.chrome || window.safari)) {
      var l = 'font-family:helvetica; font-size:20px; ';
      [
         [i, l + 'font-size:50px; font-weight:bold; ' + 'color:red; -webkit-text-stroke:1px black;'],
         [j, l],
         ['', '']
      ].map(function(r) {
          setTimeout(console.log.bind(console, '\n%c' + r[0], r[1]));
      });
    }
  },

  download: (filename, data, type, charset, href) => {
    var hiddenElement;
    if (charset === null) {
      charset = 'utf-8';
    }
    hiddenElement = document.createElement('a');
    hiddenElement.href = href || ("data:" + type + ";charset=" + charset + "," + (encodeURI(data)));
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    return hiddenElement.click();
  },

  truncateString: (s, length = 30) => {
    return s.length > length ? s.slice(0, length) + '...' : s;
  },

  getBase64: file => {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    return new Promise((resolve, reject) => {
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function (error) {
        reject('Error: ' + error);
      };
    });
  },

  hideAndRemove: el => {
    el.fadeTo(1000, 0.01, function() {
      $(this).slideUp(150, function() {
        $(this).remove();
      });
    });
  },

  checkColorScheme: () => {
    // If `prefers-color-scheme` is not supported, fall back to light mode.
    if (window.matchMedia('(prefers-color-scheme: dark)').media === 'not all') {
        document.documentElement.style.display = 'none';
        document.head.insertAdjacentHTML(
            'beforeend',
            '<link rel="stylesheet" href="./css/light.css" onload="document.documentElement.style.display = \'\'">'
        );
    }
  },

  scrollToMessageListBottom: _.throttle(() => {
    if ($('#message-view')[0]) {
      $('#message-view').scrollTop($('#message-view')[0].scrollHeight - $('#message-view')[0].clientHeight);
    }
  }, 100, true),

  setImgSrc,

  getIdenticon: (pub, width) => {
    var el = $('<div>').width(width).height(width).addClass('identicon');
    var identicon = $(new iris.Attribute({type: 'keyID', value: pub}).identicon({width, showType: false}));
    el.html(identicon);
    gun.user(pub).get('profile').get('photo').on(data => { // TODO: limit size
      if (data) {
        el.html(setImgSrc($('<img>'), data).attr('width', width).attr('height', width).addClass('identicon-image'));
      } else {
        el.html(identicon);
      }
    });
    return el;
  },

  getUserChatLink: (pub) => {
    return 'https://iris.to/?chatWith=' + pub;
  },
};
