var isElectron = (userAgent.indexOf(' electron/') > -1);
var peers = ['https://gun-us.herokuapp.com/gun', 'https://gunjs.herokuapp.com/gun'];
if (isElectron) {
  peers.push('http://localhost:8767/gun');
}
var gun = Gun({peers});
window.gun = gun;
var notificationSound = new Audio('./notification.mp3');
var chat = gun.get('converse/' + location.hash.slice(1));
var chats = {};
var autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});
var activeChat;
var onlineTimeout;
var loginTime;
var key;
var latestChatLink;
var desktopNotificationsEnabled;
var areWeOnline;
var unseenTotal;

var localStorageKey = localStorage.getItem('chatKeyPair');
if (localStorageKey) {
  login(JSON.parse(localStorageKey));
} else {
  newUserLogin();
}

function newUserLogin() {
  Gun.SEA.pair().then(k => {
    login(k);
    gun.user().get('profile').get('name').put('anonymous');
    createChatLink();
  });
}

function login(k) {
  chats = {};
  key = k;
  localStorage.setItem('chatKeyPair', JSON.stringify(k));
  irisLib.Chat.initUser(gun, key);
  $('#my-chat-links').empty();
  irisLib.Chat.getMyChatLinks(gun, key, undefined, chatLink => {
    var row = $('<div>').addClass('flex-row');
    var text = $('<div>').addClass('flex-cell').text(chatLink.url);
    var btn = $('<button>Remove</button>').click(() => {
      irisLib.Chat.removeChatLink(gun, key, chatLink.id);
      hideAndRemove(row);
    });
    row.append(text);
    row.append($('<div>').addClass('flex-cell no-flex').append(btn));
    $('#my-chat-links').append(row);
    setChatLinkQrCode(chatLink.url);
    latestChatLink = chatLink.url;
  });
  $('#generate-chat-link').off().on('click', createChatLink);
  myIdenticon = getIdenticon(key.pub, 40);
  loginTime = new Date();
  unseenTotal = 0;
  $(".chat-item:not(.new)").remove();
  $("#my-identicon").empty();
  $("#my-identicon").append(myIdenticon);
  $(".user-info").off().on('click', showSettings);
  setOurOnlineStatus();
  irisLib.Chat.getChats(gun, key, addChat);
  var chatWith = getUrlParameter('chatWith');
  if (chatWith) {
    addChat(chatWith, window.location.href);
    showChat(chatWith);
    window.history.pushState({}, "Iris Chat", "/"+window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]); // remove param
  } else {
    showNewChat();
    showMenu();
  }
  $('.user-info .user-name').text('anonymous');
  $('#settings-name').val('');
  $('#current-profile-photo').attr('src', '');
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
  setChatLinkQrCode();
}

async function createChatLink() {
  latestChatLink = await irisLib.Chat.createChatLink(gun, key);
  setChatLinkQrCode(latestChatLink);
}

function setChatLinkQrCode(link) {
  var qrCodeEl = $('#my-qr-code');
  qrCodeEl.empty();
  var qrcode = new QRCode(qrCodeEl[0], {
    text: link || getMyChatLink(),
    width: 320,
    height: 320,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

function updatePeerList() {
  var peers = gun.back('opt.peers');
  $('#peers .peer').remove();
  Object.values(peers).forEach(peer => {
    if (!peer.url) { return; }
    var row = $('<div>').addClass('flex-row peer');
    var url = $('<div>').addClass('flex-cell').text(peer.url);
    var btn = $('<button>Remove</button>').click(() => {
      hideAndRemove(row);
      gun.on('bye', peer);
    });
    row.append(url).append($('<div>').addClass('flex-cell no-flex').append(btn));
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
  irisLib.Chat.setOnline(gun, areWeOnline = true);
  document.addEventListener("mousemove", () => {
    if (!areWeOnline && activeChat) {
      chats[activeChat].setMyMsgsLastSeenTime();
    }
    irisLib.Chat.setOnline(gun, areWeOnline = true);
    clearTimeout(onlineTimeout);
    onlineTimeout = setTimeout(() => irisLib.Chat.setOnline(gun, areWeOnline = false), 60000);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      irisLib.Chat.setOnline(gun, areWeOnline = true);
      if (activeChat) {
        chats[activeChat].setMyMsgsLastSeenTime();
        changeChatUnseenCount(activeChat, 0);
      }
    } else {
      irisLib.Chat.setOnline(gun, areWeOnline = false);
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
  $("#header-content").css({cursor: null});
  $('#profile-page-qr').empty();
}

function showMenu(show = true) {
  $('.sidebar').toggleClass('hidden-xs', !show);
  $('.main').toggleClass('hidden-xs', show);
}
$('#back-button').off().on('click', () => {
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
  return latestChatLink || getUserChatLink(key.pub);
}

function getUserChatLink(pub) {
  return 'https://iris.to/?chatWith=' + pub;
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

$('.logout-button').click(newUserLogin);

$('.open-settings-button').click(showSettings);

desktopNotificationsEnabled = window.Notification && Notification.permission === 'granted';
if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
  setTimeout(() => {
    $('#enable-notifications-prompt').slideDown();
  }, 5000);
}
function enableDesktopNotifications() {
  if (window.Notification) {
    Notification.requestPermission((status) => {
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        $('#enable-notifications-prompt').slideUp();
      }
    });
  }
}
$('#enable-notifications-prompt').click(enableDesktopNotifications);

function notify(msg, info, pub) {
  function shouldNotify() {
    if (msg.time < loginTime) { return false; }
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
    var desktopNotification = new Notification(chats[pub].name, {
      icon: 'img/icon128.png',
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
    if (!$('#current-profile-photo').attr('src')) {
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

function showProfile(pub) {
  if (!pub) {
    return;
  }
  resetView();
  $('#profile .profile-photo-container').hide();
  var qrCodeEl = $('#profile-page-qr');
  qrCodeEl.empty();
  $('#profile').show();
  addUserToHeader(pub);
  gun.user(pub).get('profile').get('photo').on(photo => {
    $('#profile .profile-photo-container').show();
    $('#profile .profile-photo').attr('src', photo);
  });
  const link = getUserChatLink(pub);
  $('#profile .delete-chat').off().on('click', () => deleteChat(pub));
  $('#profile .send-message').off().on('click', () => showChat(pub));
  $('#profile .copy-user-link').off().on('click', event => {
    copyToClipboard(link);
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
  qrCodeEl.empty();
  var qrcode = new QRCode(qrCodeEl[0], {
    text: link,
    width: 300,
    height: 300,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

function addUserToHeader(pub) {
  var nameEl = $('<div class="name"></div>');
  if (chats[pub] && chats[pub].name) {
    nameEl.text(truncateString(chats[pub].name, 30));
    nameEl.show();
  } else {
    gun.user(pub).get('profile').get('name').on(name => {
      nameEl.text(truncateString(name, 30));
    });
  }
  var identicon = getIdenticon(pub, 40);
  var img = identicon.children('img').first();
  img.attr('height', 40).attr('width', 40);
  $("#header-content").append($('<div>').addClass('identicon-container').append(identicon));
  var textEl = $('<div>').addClass('text');
  textEl.append(nameEl);
  textEl.append($('<small class="last-seen"></small>'));
  $("#header-content").append(textEl);
  $("#header-content").off().on('click', () => showProfile(pub));
  $("#header-content").css({cursor: 'pointer'});
}

function changeChatUnseenCount(pub, change) {
  if (change) {
    unseenTotal += change;
    chats[pub].unseen += change;
  } else {
    unseenTotal = unseenTotal - (chats[pub].unseen || 0);
    chats[pub].unseen = 0;
  }
  unseenTotal = unseenTotal >= 0 ? unseenTotal : 0;
  var el = $('.chat-item[data-pub="' + pub +'"] .unseen');
  if (chats[pub].unseen > 0) {
    el.text(chats[pub].unseen);
    el.show();
  } else {
    el.hide();
  }
  setUnseenTotal();
}

function showChat(pub) {
  if (!pub) {
    return;
  }
  resetView();
  activeChat = pub;
  if (!Object.prototype.hasOwnProperty.call(chats, pub)) {
    addChat(pub);
  }
  var chatListEl = $('.chat-item[data-pub="' + pub +'"]');
  chatListEl.toggleClass('active', true);
  chatListEl.find('.unseen').empty().hide();
  $("#message-list").empty();
  $("#message-view").show();
  $(".message-form").show();
  if (!isMobile()) {
    $("#new-msg").focus();
  }
  $(".message-form form").off().on('submit', event => {
    event.preventDefault();
    var text = $('#new-msg').val();
    if (!text.length) { return; }
    chats[pub].send(text);
    $('#new-msg').val('');
  });
  changeChatUnseenCount(pub, 0);
  addUserToHeader(pub);
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

var sortChatsByLatest = _.throttle(() => {
  var sorted = $(".chat-item:not(.new)").sort((a, b) => {
    return ($(b).data('latestTime') || -Infinity) - ($(a).data('latestTime') || -Infinity);
  });
  $(".chat-list").append(sorted);
}, 100);

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

var seenIndicatorHtml = '<span class="seen"><svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 40"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"/></svg></span>';

function addMessage(msg) {
  var escaped = $('<div>').text(msg.text).html();
  var textEl = $('<div class="text"></div>').html(autolinker.link(escaped));
  var seenHtml = msg.selfAuthored ? ' ' + seenIndicatorHtml : '';
  var msgContent = $(
    '<div class="msg-content"><div class="time">' + formatTime(msg.time) + seenHtml + '</div></div>'
  );
  msgContent.prepend(textEl);
  if (msg.text.length === 2 && isEmoji(msg.text)) {
    textEl.toggleClass('emoji-only', true);
  } else {
    textEl.html(highlightEmoji(textEl.html()));
  }
  msgEl = $('<div class="msg"></div>').append(msgContent);
  msgEl.data('time', msg.time);
  msgEl.toggleClass('our', msg.selfAuthored ? true : false);
  msgEl.toggleClass('their', msg.selfAuthored ? false : true);
  $("#message-list").append(msgEl); // TODO: jquery insertAfter element with smaller timestamp
}

function deleteChat(pub) {
  irisLib.Chat.deleteChat(gun, key, pub);
  if (activeChat === pub) {
    showNewChat();
    showMenu();
  }
  delete chats[pub];
  $('.chat-item[data-pub="' + pub +'"]').remove();
}

function addChat(pub, chatLink) {
  if (!pub || Object.prototype.hasOwnProperty.call(chats, pub)) {
    return;
  }
  $('#welcome').remove();
  var el = $('<div class="chat-item"><div class="text"><div><span class="name"></span><small class="latest-time"></small></div> <small class="latest"></small> <span class="unseen"></span></div></div>');
  el.attr('data-pub', pub);
  chats[pub] = new irisLib.Chat({gun, key, chatLink: chatLink, participants: pub, onMessage: (msg, info) => {
    msg.selfAuthored = info.selfAuthored;
    chats[pub].messages[msg.time] = msg;
    msg.time = new Date(msg.time);
    if (!info.selfAuthored && msg.time > (chats[pub].myLastSeenTime || -Infinity)) {
      if (activeChat !== pub || document.visibilityState !== 'visible') {
        changeChatUnseenCount(pub, 1);
      }
    }
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
      var latestEl = el.find('.latest');
      latestEl.text(text);
      latestEl.html(highlightEmoji(latestEl.html()));
      if (info.selfAuthored) {
        latestEl.prepend($(seenIndicatorHtml));
        setLatestSeen(pub);
      }
      el.find('.latest-time').text(latestTimeText);
      el.data('latestTime', msg.time);
      sortChatsByLatest();
    }
    if (activeChat === pub) {
      addMessage(msg);
      sortMessagesByTime(); // this is slow if message history is loaded while chat active
      if (chats[pub].latest.time === msg.time && areWeOnline) {
        chats[pub].setMyMsgsLastSeenTime();
      }
      $('#message-view').scrollTop($('#message-view')[0].scrollHeight - $('#message-view')[0].clientHeight);
    }
    notify(msg, info, pub);
  }});
  changeChatUnseenCount(pub, 0);
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
  chats[pub].getMyMsgsLastSeenTime(time => {
    chats[pub].myLastSeenTime = new Date(time);
    if (chats[pub].latest && chats[pub].myLastSeenTime >= chats[pub].latest.time) {
      changeChatUnseenCount(pub, 0);
    }
  });
}

function setLatestSeen(pub) {
  if (chats[pub].latest && chats[pub].latest.time <= chats[pub].theirLastSeenTime) {
    $('.chat-item[data-pub="' + pub +'"] .seen').toggleClass('yes', true);
  }
}

function lastSeenTimeChanged(pub) {
  setLatestSeen(pub);
  if (pub === activeChat) {
    if (chats[pub].theirLastSeenTime) {
      $('#not-seen-by-them').hide();
      $('.msg.our').each(function() {
        var el = $(this);
        if (el.data('time') <= chats[pub].theirLastSeenTime) {
          el.find('.seen').toggleClass('yes', true);
        }
      });
      // set seen msgs
    } else {
      $('#not-seen-by-them').show();
    }
  }
}

var initialTitle = document.title;
function setUnseenTotal() {
  if (unseenTotal) {
    document.title = '(' + unseenTotal + ') ' + initialTitle;
    $('.unseen-total').text(unseenTotal).show();
  } else {
    document.title = initialTitle;
    $('.unseen-total').hide();
  }
}
