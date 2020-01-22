var gun = Gun({
  peers: [location.origin + '/gun', 'https://gun-us.herokuapp.com/gun', 'https://gunjs.herokuapp.com/gun']
});
window.gun = gun;
var notificationSound = new Audio('./notification.mp3');
var chat = gun.get('converse/' + location.hash.slice(1));
var chats = {};
var autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});
var activeChat;
var onlineTimeout;
var timeOpened = new Date();
var key;
var desktopNotificationsEnabled;
var emojiRegex =  /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug;

var localStorageKey = localStorage.getItem('chatKeyPair');
if (localStorageKey) {
  login(JSON.parse(localStorageKey));
} else {
  Gun.SEA.pair().then(k => login(k));
}

function login(k) {
  chats = {};
  key = k;
  localStorage.setItem('chatKeyPair', JSON.stringify(k));
  irisLib.Chat.initUser(gun, key);
  irisLib.Chat.getMyChatLinks(gun, key, undefined, chatLink => {
    var row = $('<tr>');
    var text = $('<td>').text(chatLink.url);
    var btn = $('<button>Remove</button>').click(() => {
      irisLib.Chat.removeChatLink(gun, key, chatLink.id);
      row.remove();
    });
    row.append(text);
    row.append($('<td>').append(btn));
    $('#my-chat-links').append(row);
  });
  $('#generate-chat-link').click(() => {
    irisLib.Chat.createChatLink(gun, key);
  });
  myIdenticon = getIdenticon(key.pub, 40);
  $(".chat-item:not(.new)").remove();
  $("#my-identicon").empty();
  $("#my-identicon").append(myIdenticon);
  $(".user-info").click(showSettings);
  setOurOnlineStatus();
  irisLib.Chat.getChats(gun, key, addChat);
  var chatWith = getUrlParameter('chatWith');
  if (chatWith) {
    addChat(chatWith, window.location.href);
    showChat(chatWith);
    window.history.pushState({}, "Iris Chat", "/"+window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]); // remove param
  } else {
    showNewChat();
  }
  $('.user-info .user-name').text('anonymous');
  $('#settings-name').val('');
  gun.user().get('profile').get('name').on(name => {
    if (name && typeof name === 'string') {
      $('.user-info .user-name').text(truncateString(name, 20));
      var el = $('#settings-name');
      if (!el.is(':focus')) {
        $('#settings-name').val(name);
      }
    }
  });
  gun.user().get('profile').get('photo').on(data => {
    $('#current-profile-photo').attr('src', data);
    $('#add-profile-photo').toggleClass('hidden', true);
  });
  var qrCodeEl = $('#my-qr-code');
  qrCodeEl.empty();
  var qrcode = new QRCode(qrCodeEl[0], {
  	text: getMyChatLink(),
  	width: 256,
  	height: 256,
  	colorDark : "#000000",
  	colorLight : "#ffffff",
  	correctLevel : QRCode.CorrectLevel.H
  });
}

function updatePeerList() {
  var o = gun._.opt.peers;
  var peers = gun.back('opt.peers');
  $('#peers .peer').remove();
  Object.values(peers).forEach(peer => {
    if (!peer.url) { return; }
    var row = $('<tr>').addClass('peer');
    var url = $('<td>').text(peer.url);
    var btn = $('<button>Remove</button>').click(() => {
      row.remove();
      gun.on('bye', peer);
    });
    row.append(url).append($('<td>').append(btn));
    $('#peers').prepend(row);
  });
}
updatePeerList();
setInterval(updatePeerList, 2000);
$('#add-peer-btn').click(() => {
  var url = $('#add-peer-input').val();
  gun.opt({peers: [url]});
  $('#add-peer-input').val('');
  updatePeerList();
});

var emojiButton = $('#emoji-picker');
if (!isMobile()) {
  emojiButton.show();
  var picker = new EmojiButton({position: 'top-start'});

  picker.on('emoji', emoji => {
    $('#new-msg').val($('#new-msg').val() + emoji);
    $('#new-msg').focus();
  });

  emojiButton.click(event => {
    event.preventDefault();
    picker.pickerVisible ? picker.hidePicker() : picker.showPicker(emojiButton);
  });
}

$('#paste-chat-link').on('input', event => {
  var val = $(event.target).val();
  if (val.length < 30 || val.indexOf('chatWith') === -1) {
    return;
  }
  var s = val.split('?');
  if (s.length !== 2) { return; }
  var pub = getUrlParameter('chatWith', s[1]);
  addChat(pub, val);
  showChat(pub);
  $(event.target).val('');
});

$('.chat-item.new').click(showNewChat);

$('#settings-name').on('input', event => {
  var name = $(event.target).val().trim();
  gun.user().get('profile').get('name').put(name);
});

function setOurOnlineStatus() {
  irisLib.Chat.setOnline(gun, true);
  document.addEventListener("mousemove", () => {
    irisLib.Chat.setOnline(gun, true);
    clearTimeout(onlineTimeout);
    onlineTimeout = setTimeout(() => irisLib.Chat.setOnline(gun, false), 60000); // TODO: setOnline false not working?
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      irisLib.Chat.setOnline(gun, true);
      if (activeChat) {
        chats[activeChat].setMyMsgsLastSeenTime();
      }
    } else {
      irisLib.Chat.setOnline(gun, false);
    }
  });
}

function resetView() {
  activeChat = null;
  showMenu(false);
  $('.chat-item').toggleClass('active', false);
  $('.main-view').hide();
  $('#not-seen-by-them').hide();
  $(".message-form").hide();
  $("#header-content").empty();
}

function showMenu(show = true) {
  $('.sidebar').toggleClass('hidden-xs', !show);
  $('.main').toggleClass('hidden-xs', show);
}
$('#back-button').click(() => {
  resetView();
  showMenu(true);
});
$(window).resize(() => { // if resizing up from mobile size menu view
  if ($(window).width() > 565 && $('.main-view:visible').length === 0) {
    showNewChat();
  }
});

function showSettings() {
  resetView();
  $('#header-content').text('Settings');
  $('#settings').show();
}

function showNewChat() {
  resetView();
  $('.chat-item.new').toggleClass('active', true);
  $('#new-chat').show();
  $("#header-content").text('Start new chat');
}

function getMyChatLink() {
  return 'https://chat.iris.to/?chatWith=' + key.pub;
}

$('.copy-chat-link').click(event => {
  copyToClipboard(getMyChatLink());
  var t = $(event.target);
  var originalText = t.text();
  var originalWidth = t.width();
  t.width(originalWidth);
  t.text('Copied');
  setTimeout(() => {
    t.text(originalText);
    t.css('width', '');
  }, 2000);
});

$('#copy-private-key').click(event => {
  copyToClipboard(JSON.stringify(key));
  var t = $(event.target);
  var originalText = t.text();
  var originalWidth = t.width();
  t.width(originalWidth);
  t.text('Copied');
  setTimeout(() => {
    t.text(originalText);
    t.css('width', '');
  }, 2000);
});

$('#download-private-key').click(downloadKey);

$('.show-logout-confirmation').click(showLogoutConfirmation);
function showLogoutConfirmation() {
  resetView();
  $('#header-content').text('Log out?');
  $('#logout-confirmation').show();
}

$('.show-switch-account').click(showSwitchAccount);
function showSwitchAccount() {
  resetView();
  $('#header-content').text('Switch account');
  $('#switch-account').show();
}

$('#switch-account input').on('input', (event) => {
  var val = $(event.target).val();
  if (!val.length) { return; }
  try {
    var key = JSON.parse(val);
    login(key);
    $(event.target).val('');
  } catch (e) {
    console.error('Login with key', val, 'failed:', e);
  }
});

$('.logout-button').click(() => {
  Gun.SEA.pair().then(key => login(key));
});

$('.open-settings-button').click(showSettings);

desktopNotificationsEnabled = window.Notification && Notification.permission === 'granted';
if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
  setTimeout(() => {
    $('#enable-notifications-prompt').animate({height: 'show'});
  }, 5000);
}
function enableDesktopNotifications() {
  if (window.Notification) {
    Notification.requestPermission((status) => {
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        $('#enable-notifications-prompt').hide();
      }
    });
  }
}
$('#enable-notifications-prompt').click(enableDesktopNotifications);

function notify(msg, info, pub) {
  function shouldNotify() {
    if (msg.time < timeOpened) { return false; }
    if (info.selfAuthored) { return false; }
    if (document.visibilityState === 'visible') { return false; }
    return true;
  }
  function shouldDesktopNotify() {
    if (!desktopNotificationsEnabled) { return false; }
    return shouldNotify();
  }
  function shouldAudioNotify() {
    return shouldNotify();
  }
  if (shouldAudioNotify()) {
    notificationSound.play();
  }
  if (shouldDesktopNotify()) {
    var desktopNotification = new Notification(msg.author, {
      icon: 'icon128.png',
      body: truncateString(msg.text, 50),
      silent: true
    });
    desktopNotification.onclick = function() {
      showChat(pub);
      window.focus();
    };
  }
}

function renderProfilePhotoSettings() {
  $('#profile-photo-error').toggleClass('hidden', true);
  var files = $('#profile-photo-input')[0].files;
  if (files && files.length) {
    var file = files[0];
    if (file.size > 1024 * 200) {
      $('#profile-photo-error').toggleClass('hidden', false);
      return console.error('file too big');
    }
    // show preview
    $('#current-profile-photo').hide();
    $('#add-profile-photo').hide();
    getBase64(file).then(base64 => {
      $('#profile-photo-preview').attr('src', base64);
      $('#profile-photo-preview').toggleClass('hidden', false);
      $('#cancel-profile-photo').toggleClass('hidden', false);
      $('#use-profile-photo').toggleClass('hidden', false);
    });
  } else {
    // show current profile photo
    $('#current-profile-photo').show();
    if ($('#current-profile-photo').attr('src')) {
      $('#add-profile-photo').show();
    }
    $('#profile-photo-preview').attr('src', '');
    $('#cancel-profile-photo').toggleClass('hidden', true);
    $('#use-profile-photo').toggleClass('hidden', true);
  }
}
$('#current-profile-photo, #add-profile-photo').click(() => $('#profile-photo-input').click());
$('#profile-photo-input').change(e => {
  renderProfilePhotoSettings();
});
$('#use-profile-photo').click(() => {
  var src = $('#profile-photo-preview').attr('src');
  gun.user().get('profile').get('photo').put(src);
  $('#current-profile-photo').attr('src', src);
  $('#profile-photo-input').val('');
  renderProfilePhotoSettings();
});
$('#cancel-profile-photo').click(() => {
  $('#profile-photo-input').val('');
  renderProfilePhotoSettings();
});
$('#remove-profile-photo').click(() => {
  gun.user().get('profile').get('photo').put(null);
  renderProfilePhotoSettings();
});

function showChat(pub) {
  if (!pub || !Object.prototype.hasOwnProperty.call(chats, pub)) {
    return;
  }
  resetView();
  activeChat = pub;
  $('.chat-item[data-pub="' + pub +'"]').toggleClass('active', true);
  $("#message-list").empty();
  $("#message-view").show();
  $(".message-form").show();
  $(".message-form form").off('submit');
  $(".message-form form").on('submit', event => {
    event.preventDefault();
    var text = $('#new-msg').val();
    if (!text.length) { return; }
    chats[pub].send(text);
    $('#new-msg').val('');
  });
  var nameEl = $('<div class="name"></div>');
  if (chats[pub].name) {
    nameEl.text(truncateString(chats[pub].name, 30));
    nameEl.show();
  }
  var identicon = getIdenticon(pub, 40);
  var img = identicon.children('img').first();
  img.attr('height', 40).attr('width', 40);
  $("#header-content").append($('<div>').addClass('identicon-container').append(identicon));
  var textEl = $('<div>').addClass('text');
  textEl.append(nameEl);
  textEl.append($('<small class="last-seen"></small>'));
  $("#header-content").append(textEl);
  var msgs = Object.values(chats[pub].messages);
  msgs.forEach(addMessage);
  sortMessagesByTime();
  $('#message-view').scroll(() => {
    var scrollPosition = $('#message-view').scrollTop();
    var currentDaySeparator = $('.day-separator').last();
    var pos = currentDaySeparator.position();
    while (currentDaySeparator && pos && pos.top - 55 > 0) {
      currentDaySeparator = currentDaySeparator.prevAll('.day-separator').first();
      pos = currentDaySeparator.position();
    }
    var s = currentDaySeparator.clone();
    var center = $('<div>').css({position: 'fixed', top: 70, 'text-align': 'center'}).attr('id', 'floating-day-separator').width($('#message-view').width()).append(s);
    $('#floating-day-separator').remove();
    setTimeout(() => s.fadeOut(), 2000);
    $('#message-view').prepend(center);
  });
  lastSeenTimeChanged(pub);
  chats[pub].setMyMsgsLastSeenTime();
  $('#message-view').scrollTop($('#message-view')[0].scrollHeight - $('#message-view')[0].clientHeight);
  chats[pub].setMyMsgsLastSeenTime();
  function setTheirOnlineStatus() {
    var online = chats[pub].online;
    if (activeChat === pub) {
      if (online.isOnline) {
        $('#header-content .last-seen').text('online');
      } else if (online.lastActive) {
        var d = new Date(online.lastActive * 1000);
        var lastSeenText = getDaySeparatorText(d, d.toLocaleDateString({dateStyle:'short'}));
        if (lastSeenText === 'today') {
          lastSeenText = formatTime(d);
        } else {
          lastSeenText = formatDate(d);
        }
        $('#header-content .last-seen').text('last seen ' + lastSeenText);
      }
    }
  }
  if (!chats[pub].online) {
    chats[pub].online = {};
    irisLib.Chat.getOnline(gun, pub, (online) => {
      if (chats[pub]) {
        chats[pub].online = online;
        setTheirOnlineStatus();
      }
    });
  }
  setTheirOnlineStatus();
}

function getIdenticon(pub, width) {
  var el = $('<div>').width(width).height(width).addClass('identicon');
  var identicon = $(new irisLib.Attribute({type: 'keyID', value: pub}).identicon({width, showType: false}));
  el.html(identicon);
  gun.user(pub).get('profile').get('photo').on(data => { // TODO: limit size
    if (data) {
      el.html($('<img>').attr('src', data).attr('width', width).attr('height', width).addClass('identicon-image'));
    } else {
      el.html(identicon);
    }
  });
  return el;
}

function sortChatsByLatest() {
  var sorted = $(".chat-item").sort((a, b) => $(b).data('latestTime') - $(a).data('latestTime'));
  $(".chat-list").append(sorted);
}

function sortMessagesByTime() {
  var sorted = $(".msg").sort((a, b) => $(a).data('time') - $(b).data('time'));
  $("#message-list").append(sorted);
  $('.day-separator').remove();
  var now = new Date();
  var nowStr = now.toLocaleDateString();
  var previousDateStr;
  sorted.each(function() {
    var date = $(this).data('time');
    if (!date) { return; }
    var dateStr = date.toLocaleDateString();
    if (dateStr !== previousDateStr) {
      var separatorText = getDaySeparatorText(date, dateStr, now, nowStr);
      $(this).before($('<div>').text(separatorText).addClass('day-separator'));
    }
    previousDateStr = dateStr;
  });
}

function addMessage(msg) {
  var escaped = $('<div>').text(msg.text).html();
  var textEl = $('<div class="text"></div>').html(autolinker.link(escaped));
  var msgContent = $(
    '<div class="msg-content"><div class="time"><span class="seen">✔</span> ' + formatTime(msg.time) + '</div></div>'
  );
  msgContent.prepend(textEl);
  if (msg.text.length === 2 && msg.text.match(emojiRegex)) {
    textEl.toggleClass('emoji-only', true);
  }
  msgEl = $('<div class="msg"></div>').append(msgContent);
  msgEl.data('time', msg.time);
  msgEl.toggleClass('our', msg.selfAuthored ? true : false);
  msgEl.toggleClass('their', msg.selfAuthored ? false : true);
  $("#message-list").append(msgEl); // TODO: jquery insertAfter element with smaller timestamp
}

function addChat(pub, chatLink) {
  if (!pub || Object.prototype.hasOwnProperty.call(chats, pub)) {
    return;
  }
  var el = $('<div class="chat-item"><div class="text"><div><span class="name"></span><small class="latest-time"></small></div> <small class="latest"></small></div></div>');
  el.attr('data-pub', pub);
  chats[pub] = new irisLib.Chat({gun, key, chatLink: chatLink, participants: pub, onMessage: (msg, info) => {
    msg.selfAuthored = info.selfAuthored;
    chats[pub].messages[msg.time] = msg;
    msg.time = new Date(msg.time);
    if (!info.selfAuthored && msg.time > chats[pub].theirLastSeenTime) {
      chats[pub].theirLastSeenTime = msg.time;
      lastSeenTimeChanged(pub);
    }
    if (!chats[pub].latest || msg.time > chats[pub].latest.time) {
      chats[pub].latest = msg;
      var text = truncateString(msg.text, 100);
      var now = new Date();
      var latestTimeText = getDaySeparatorText(msg.time, msg.time.toLocaleDateString({dateStyle:'short'}));
      if (latestTimeText === 'today') { latestTimeText = formatTime(msg.time); }
      el.find('.latest').text(text);
      el.find('.latest-time').text(latestTimeText);
      el.data('latestTime', msg.time);
      sortChatsByLatest();
    }
    if (activeChat === pub) {
      addMessage(msg);
      sortMessagesByTime(); // this is slow if message history is loaded while chat active
      if (chats[pub].latest.time === msg.time && document.visibilityState === 'visible') {
        chats[pub].setMyMsgsLastSeenTime();
      }
      $('#message-view').scrollTop($('#message-view')[0].scrollHeight - $('#message-view')[0].clientHeight);
    }
    notify(msg, info, pub);
  }});
  chats[pub].messages = chats[pub].messages || [];
  chats[pub].identicon = getIdenticon(pub, 49);
  el.prepend($('<div>').addClass('identicon-container').append(chats[pub].identicon));
  gun.user(pub).get('profile').get('name').on(name => {
    if (name && typeof name === 'string') {
      chats[pub].name = name;
      el.find('.name').text(truncateString(name, 20));
      if (pub === activeChat) {
        $('#header-content .name').text(truncateString(name, 30));
      }
    }
  });
  el.click(() => showChat(pub));
  $(".chat-list").append(el);
  chats[pub].getTheirMsgsLastSeenTime(time => {
    chats[pub].theirLastSeenTime = new Date(time);
    lastSeenTimeChanged(pub);
  });
}

function lastSeenTimeChanged(pub) {
  if (pub === activeChat) {
    if (chats[pub].theirLastSeenTime) {
      $('#not-seen-by-them').hide();
      $('.msg.our').each(function() {
        var el = $(this);
        if (el.data('time') <= chats[pub].theirLastSeenTime) {
          el.find('.seen').show();
        }
      });
      // set seen msgs
    } else {
      $('#not-seen-by-them').show();
    }
  }
}

/* Helpers */

function formatTime(date) {
  return date.toLocaleString(undefined, {timeStyle:"short"});
}

function formatDate(date) {
  return date.toLocaleString(undefined, {dateStyle:"short", timeStyle:"short"});
}

function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
        return clipboardData.setData("Text", text);
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
}

function getUrlParameter(sParam, sParams) {
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
};

function download(filename, data, type, charset, href) {
  var hiddenElement;
  if (charset === null) {
    charset = 'utf-8';
  }
  hiddenElement = document.createElement('a');
  hiddenElement.href = href || ("data:" + type + ";charset=" + charset + "," + (encodeURI(data)));
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  return hiddenElement.click();
};

function downloadKey() {
  return download('iris_private_key.txt', JSON.stringify(key), 'text/csv', 'utf-8');
};

function isMobile() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

function truncateString(s, length = 30) {
  return s.length > length ? s.slice(0, length) + '...' : s;
}

function getDaySeparatorText(date, dateStr, now, nowStr) {
  if (!now) {
    now = new Date();
    nowStr = now.toLocaleDateString({dateStyle:'short'});
  }
  if (dateStr === nowStr) {
    return 'today';
  }
  var dayDifference = Math.round((now - date)/(1000*60*60*24));
  if (dayDifference <= 1) {
    return 'yesterday';
  }
  if (dayDifference <= 5) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }
  return dateStr;
}

function getBase64(file) {
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
}
