Gun.log.off = true;
var MAX_PEER_LIST_SIZE = 10;
var MAX_CONNECTED_PEERS = iris.util.isElectron ? 4 : 2;
var peers = getPeers();
var randomPeers = _.sample(
  Object.keys(
    _.pick(peers, p => { return p.enabled; })
  ), MAX_CONNECTED_PEERS
);
var gunOpts = { peers: randomPeers, localStorage: false };
if (!iris.util.isElectron) {
  gunOpts.store = RindexedDB(gunOpts);
}
var gun = Gun(gunOpts);
window.gun = gun;

function checkGunPeerCount() {
  var peersFromGun = gun.back('opt.peers');
  var connectedPeers = _.filter(Object.values(peersFromGun), (peer) => {
    return peer && peer.wire && peer.wire.hied === 'hi';
  });
  if (connectedPeers.length < MAX_CONNECTED_PEERS) {
    var unconnectedPeers = _.filter(Object.keys(peers), url => {
      var addedToGun = _.pluck(Object.values(peersFromGun), 'url').indexOf(url) > -1;
      var enabled = peers[url].enabled;
      return enabled && !addedToGun;
    });
    if (unconnectedPeers.length) {
      connectPeer(_.sample(unconnectedPeers));
    }
  }
  if (connectedPeers.length > MAX_CONNECTED_PEERS) {
    disconnectPeer(_.sample(connectedPeers));
  }
}
setInterval(checkGunPeerCount, 2000);

var notificationSound = new Audio('./notification.mp3');
var chat = gun.get('converse/' + location.hash.slice(1));
var chats = window.chats = {};
var autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});
var activeChat;
var activeProfile;
var onlineTimeout;
var loginTime;
var key;
var myName;
var latestChatLink;
var desktopNotificationsEnabled;
var areWeOnline;
var unseenTotal;

if (iris.util.isElectron) {
  function refreshUnlessActive() { // hacky way to make sure that gun resubscribes multicast on network changes
    if (!areWeOnline) { // if you haven't been active in the window in the last 60 seconds
      location.reload();
    }
  }
  window.addEventListener('online',  refreshUnlessActive);
}

$(window).load(() => {
  $('body').css('opacity', 1); // use opacity because setting focus on display: none elements fails
});

$('#login').hide();
var localStorageKey = localStorage.getItem('chatKeyPair');
if (localStorageKey) {
  login(JSON.parse(localStorageKey));
} else {
  newUserLogin();
}
showConsoleWarning();

function getPeers() {
  var p = localStorage.getItem('gunPeers');
  if (p && p !== 'undefined') {
    p = JSON.parse(p);
  } else {
    p = {
      'https://gun-us.herokuapp.com/gun': {},
      'https://gun-eu.herokuapp.com/gun': {},
      'https://gunjs.herokuapp.com/gun': {}
    };
  }
  if (iris.util.isElectron) {
    p['http://localhost:8767/gun'] = {};
  }
  Object.keys(p).forEach(k => _.defaults(p[k], {enabled: true}));
  return p;
}

function resetPeers() {
  localStorage.setItem('gunPeers', undefined);
  peers = getPeers();
}

function savePeers() {
  localStorage.setItem('gunPeers', JSON.stringify(peers));
}

function connectPeer(url) {
  if (peers[url]) {
    peers[url].enabled = true;
    gun.opt({peers: [url]});
    savePeers();
  } else {
    addPeer({url});
  }
}

function disablePeer(url, peerFromGun) {
  peers[url].enabled = false;
  if (peerFromGun) {
    disconnectPeer(peerFromGun);
  }
  savePeers();
}

function disconnectPeer(peerFromGun) {
  gun.on('bye', peerFromGun);
  peerFromGun.url = '';
}

async function addPeer(peer) {
  if (!isUrl(peer.url)) {
    throw new Error('Invalid url', peer.url);
  }
  peers[peer.url] = peers[peer.url] || _.omit(peer, 'url');
  if (peer.visibility === 'public') {
    // rolling some crypto operations to obfuscate actual url in case we want to remove it
    var secret = await Gun.SEA.secret(key.epub, key);
    var encryptedUrl = await Gun.SEA.encrypt(peer.url, secret);
    var encryptedUrlHash = await Gun.SEA.work(encryptedUrl, null, null, {name: 'SHA-256'});
    gun.user().get('peers').get(encryptedUrlHash).put({url: peer.url, lastSeen: new Date().toISOString()});
  }
  if (peer.enabled !== false) {
    connectPeer(peer.url);
  } else {
    savePeers();
  }
}

function newUserLogin() {
  $('#login').show();
  $('#login-form-name').focus();
  $('#login-form').submit(function(e) {
    e.preventDefault();
    var name = $('#login-form-name').val();
    if (name.length) {
      $('#login').hide();
      Gun.SEA.pair().then(k => {
        login(k);
        gun.user().get('profile').get('name').put(name);
        createChatLink();
      });
    }
  });
}

function login(k) {
  chats = {};
  key = k;
  localStorage.setItem('chatKeyPair', JSON.stringify(k));
  $('#login').hide();
  iris.Channel.initUser(gun, key);
  $('#my-chat-links').empty();
  iris.Channel.getMyChatLinks(gun, key, undefined, chatLink => {
    var row = $('<div>').addClass('flex-row');
    var text = $('<div>').addClass('flex-cell').text(chatLink.url);
    var btn = $('<button>Remove</button>').click(() => {
      iris.Channel.removeChatLink(gun, key, chatLink.id);
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
  $(".profile-link").attr('href', getUserChatLink(key.pub)).off().on('click', e => {
    e.preventDefault();
    if (chats[key.pub]) {
      showProfile(key.pub);
    }
  });
  setOurOnlineStatus();
  iris.Channel.getChannels(gun, key, addChat);
  var chatId = getUrlParameter('chatWith') || getUrlParameter('channelId');
  var inviter = getUrlParameter('inviter');
  if (chatId) {
    function go() {
      if (inviter !== key.pub) {
        newChat(chatId, window.location.href);
      }
      showChat(chatId);
      window.history.pushState({}, "Iris Chat", "/"+window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]); // remove param
    }
    if (inviter) {
      setTimeout(go, 2000); // wait a sec to not re-create the same chat
    } else {
      go();
    }
  } else {
    if (iris.util.isMobile) {
      showMenu();
    } else {
      showNewChat();
    }
  }
  $('.user-info .user-name').text('anonymous');
  $('#settings-name').val('');
  $('#current-profile-photo').attr('src', '');
  $('#private-key-qr').remove();
  gun.user().get('profile').get('name').on(name => {
    if (name && typeof name === 'string') {
      myName = name;
      $('.user-info .user-name').text(truncateString(name, 20));
      $('#settings-name').not(':focus').val(name);
    }
  });
  gun.user().get('profile').get('about').on(about => {
    $('#settings-about').not(':focus').val(about || '');
  });
  gun.user().get('profile').get('photo').on(data => {
    $('#current-profile-photo').attr('src', data);
    $('#add-profile-photo').toggleClass('hidden', true);
  });
  setChatLinkQrCode();
  if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    setTimeout(() => {
      $('#enable-notifications-prompt').slideDown();
    }, 5000);
  }
}

async function createChatLink() {
  latestChatLink = await iris.Channel.createChatLink(gun, key);
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
  var peersFromGun = gun.back('opt.peers');
  $('#peers .peer').remove();
  $('#reset-peers').remove();
  var urls = Object.keys(peers);
  if (urls.length === 0) {
    var resetBtn = $('<button>').attr('id', 'reset-peers').css({'margin-bottom': '15px'}).text('Reset default peers').click(() => {
      resetPeers();
      updatePeerList();
    });
    $('#peers').prepend(resetBtn);
  }
  urls.forEach(url => {
    var peer = peers[url];
    var peerFromGun = peersFromGun[url];
    var connected = peerFromGun && peerFromGun.wire && peerFromGun.wire.hied === 'hi';
    var row = $('<div>').addClass('flex-row peer');
    var urlEl = $('<div>').addClass('flex-cell').text(url);
    var removeBtn = $('<button>Remove</button>').click(() => {
      hideAndRemove(row); // this may be screwed by setInterval removing before animation finished
      delete peers[url];
      savePeers();
      if (peerFromGun) {
        disconnectPeer(peerFromGun);
      }
    });
    var connectBtn = $('<button>').text(peer.enabled ? 'Disable' : 'Enable').click(function() {
      if (peer.enabled) {
        disablePeer(url, peerFromGun);
      } else {
        connectPeer(url);
      }
      updatePeerList();
    });
    row.append(urlEl).append($('<div>').addClass('flex-cell no-flex').append(connectBtn).append(removeBtn));
    if (connected) {
      row.prepend('+ ');
    } else {
      row.prepend('- ');
    }
    if (peer.from) {
      urlEl.append($('<br>'));
      urlEl.append(
        $('<small>').text('from ' + ((chats[peer.from] && getDisplayName(peer.from)) || truncateString(peer.from, 10)))
        .css({cursor:'pointer'}).click(() => showChat(peer.from))
      );
    }
    $('#peers').prepend(row);
  });
}
updatePeerList();
setInterval(updatePeerList, 2000);
$('#add-peer-btn').click(() => {
  var url = $('#add-peer-url').val();
  var visibility = $('#add-peer-public').is(':checked') ? 'public' : undefined;
  addPeer({url, visibility});
  $('#add-peer-url').val('');
  updatePeerList();
});

var emojiButton = $('#emoji-picker');
if (!iris.util.isMobile) {
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

$(document).keyup(function(e) {
  if (e.key === "Escape") { // escape key maps to keycode `27`
  if ($('#attachment-preview.gallery:visible').length) {
    closeAttachmentsGallery();
  } else {
    closeAttachmentsPreview();
  }
  }
});

function openAttachmentsPreview() {
  $('#floating-day-separator').remove();
  var attachmentsPreview = $('#attachment-preview');
  attachmentsPreview.removeClass('gallery');
  attachmentsPreview.empty();
  var closeBtn = $('<button>').text('Cancel').click(closeAttachmentsPreview);
  attachmentsPreview.append(closeBtn);

  var files = $('#attachment-input')[0].files;
  if (files) {
    attachmentsPreview.show();
    $('#message-list').hide();
    for (var i = 0;i < files.length;i++) {
      getBase64(files[i]).then(base64 => {
        chats[activeChat].attachments = chats[activeChat].attachments || [];
        chats[activeChat].attachments.push({type: 'image', data: base64});
        var preview = $('<img>').attr('src', base64);
        attachmentsPreview.append(preview);
      });
    }
    $('#new-msg').focus();
  }
}

function openAttachmentsGallery(msg, event) {
  $('#floating-day-separator').remove();
  var attachmentsPreview = $('#attachment-preview');
  attachmentsPreview.addClass('gallery');
  attachmentsPreview.empty();
  attachmentsPreview.fadeIn(100);
  var left, top, width, img;

  if (msg.attachments) {
    msg.attachments.forEach(a => {
      if (a.type.indexOf('image') === 0 && a.data) {
        img = $('<img>').attr('src', a.data);
        if (msg.attachments.length === 1) {
          attachmentsPreview.css({'justify-content': 'center'});
          var original = $(event.target);
          left = original.offset().left;
          top = original.offset().top - $(window).scrollTop();
          width = original.width();
          var transitionImg = img.clone();
          transitionImg.css({position: 'fixed', left, top, width, 'max-width': 'none', 'max-height': 'none'});
          img.css({visibility: 'hidden', 'align-self': 'center'});
          attachmentsPreview.append(img);
          $('body').append(transitionImg);
          var o = img.offset();
          transitionImg.animate({width: img.width(), left: o.left, top: o.top}, {duration: 300, complete: () => {
            img.css({visibility: 'visible'});
            transitionImg.remove();
          }});
        } else {
          attachmentsPreview.css({'justify-content': ''});
          attachmentsPreview.append(img);
        }
      }
    })
  }
  $('#attachment-preview').one('click', () => {
    closeAttachmentsGallery();
  });
}

function closeAttachmentsPreview() {
  $('#attachment-preview').hide();
  $('#attachment-preview').removeClass('gallery');
  $('#message-list').show();
  if (activeChat) {
    chats[activeChat].attachments = null;
  }
}

function closeAttachmentsGallery() {
  $('#attachment-preview').fadeOut(300);
  if (activeChat) {
    chats[activeChat].attachments = null;
  }
}

$('#attach-file').click(event => {
  event.preventDefault();
  $('#attachment-input').click();
})
$('#attachment-input').change(openAttachmentsPreview);

$('#desktop-application-about').toggle(!iris.util.isMobile && !iris.util.isElectron);

$('#paste-chat-link').on('input', event => {
  var val = $(event.target).val();
  if (val.length < 30) {
    return;
  }
  var s = val.split('?');
  if (s.length !== 2) { return; }
  var chatId = getUrlParameter('chatWith', s[1]) || getUrlParameter('channelId', s[1]);
  if (chatId) {
    newChat(chatId, val);
    showChat(chatId);
  }
  $(event.target).val('');
});

$('#new-group-create').click(createGroup);
function createGroup(e) {
  e.preventDefault();
  if ($('#new-group-name').val().length) {
    var c = new iris.Channel({
      gun,
      key,
      participants: [],
    });
    c.put('name', $('#new-group-name').val());
    $('#new-group-name').val('');
    addChat(c);
    showProfile(c.uuid);
  }
}

$('.chat-item.new').click(showNewChat);

$('#settings-name').on('input', event => {
  var name = $(event.target).val().trim();
  gun.user().get('profile').get('name').put(name);
});

$('#settings-about').on('input', event => {
  var about = $(event.target).val().trim();
  gun.user().get('profile').get('about').put(about);
});

function setOurOnlineStatus() {
  iris.Channel.setOnline(gun, areWeOnline = true);
  document.addEventListener("mousemove", () => {
    if (!areWeOnline && activeChat) {
      chats[activeChat].setMyMsgsLastSeenTime();
    }
    iris.Channel.setOnline(gun, areWeOnline = true);
    clearTimeout(onlineTimeout);
    onlineTimeout = setTimeout(() => iris.Channel.setOnline(gun, areWeOnline = false), 60000);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      iris.Channel.setOnline(gun, areWeOnline = true);
      if (activeChat) {
        chats[activeChat].setMyMsgsLastSeenTime();
        changeChatUnseenCount(activeChat, 0);
      }
    } else {
      iris.Channel.setOnline(gun, areWeOnline = false);
    }
  });
}

function resetView() {
  if (activeChat) {
    chats[activeChat].setTyping(false);
  }
  activeChat = null;
  activeProfile = null;
  showMenu(false);
  cleanupScanner();
  $('#chatlink-qr-video').hide();
  $('.chat-item').toggleClass('active', false);
  $('.main-view').hide();
  $('#not-seen-by-them').hide();
  $(".message-form").hide();
  $("#header-content").empty();
  $("#header-content").css({cursor: null});
  $('#private-key-qr').remove();
  closeAttachmentsPreview();
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
  $("#header-content").text('New chat');
  $('#show-my-qr-btn').off().click(() => {
    $('#my-qr-code').toggle()
  })
}

function getMyChatLink() {
  return latestChatLink || getUserChatLink(key.pub);
}

function getUserChatLink(pub) {
  return 'https://iris.to/?chatWith=' + pub;
}

var scanPrivKeyBtn = $('#scan-privkey-btn');
scanPrivKeyBtn.click(() => {
  if ($('#privkey-qr-video:visible').length) {
    $('#privkey-qr-video').hide();
    cleanupScanner();
  } else {
    $('#privkey-qr-video').show();
    startPrivKeyQRScanner();
  }
});

$('#scan-chatlink-qr-btn').click(() => {
  if ($('#chatlink-qr-video:visible').length) {
    $('#chatlink-qr-video').hide();
    cleanupScanner();
  } else {
    $('#chatlink-qr-video').show();
    startChatLinkQRScanner();
  }
});

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
$('#show-private-key-qr').click(togglePrivateKeyQR);

function togglePrivateKeyQR(e) {
  var btn = $('#show-private-key-qr');
  var show = $('#private-key-qr').length === 0;
  var SHOW_TEXT = 'Show private key QR code';
  function hideText(s) { return 'Hide private key QR code (' + s + ')'; }
  if (show) {
    var showPrivateKeySecondsRemaining = 20;
    btn.text(hideText(showPrivateKeySecondsRemaining));
    var hidePrivateKeyInterval = setInterval(() => {
      if ($('#private-key-qr').length === 0) {
        clearInterval(hidePrivateKeyInterval);
        btn.text(SHOW_TEXT);
      }
      showPrivateKeySecondsRemaining -= 1;
      if (showPrivateKeySecondsRemaining === 0) {
       $('#private-key-qr').remove();
        btn.text(SHOW_TEXT);
        clearInterval(hidePrivateKeyInterval);
      } else {
        btn.text(hideText(showPrivateKeySecondsRemaining));
      }
    }, 1000);
    var qrCodeEl = $('<div>').attr('id', 'private-key-qr').addClass('qr-container').insertAfter(btn);
    var qrcode = new QRCode(qrCodeEl[0], {
      text: JSON.stringify(key),
      width: 300,
      height: 300,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  } else {
    $('#private-key-qr').remove();
    btn.text(SHOW_TEXT);
  }
}

$('.show-logout-confirmation').click(showLogoutConfirmation);
function showLogoutConfirmation() {
  resetView();
  $('#header-content').text('Log out?');
  $('#logout-confirmation').show();
}

$('#show-existing-account-login').click(showSwitchAccount);
function showSwitchAccount(e) {
  e.preventDefault();
  resetView();
  $('#create-account').hide();
  $('#existing-account-login').show();
  $('#paste-privkey').focus();
}

$('#show-create-account').click(showCreateAccount);
function showCreateAccount(e) {
  e.preventDefault();
  $('#privkey-qr-video').hide();
  $('#create-account').show();
  $('#existing-account-login').hide();
  cleanupScanner();
  $('#login-form-name').focus();
}

$('#existing-account-login input').on('input', (event) => {
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
  localStorage.removeItem('chatKeyPair');
  location.reload(); // ensure that everything is reset (especially on the gun side). TODO: without reload
});

$('.open-settings-button').click(showSettings);

desktopNotificationsEnabled = window.Notification && Notification.permission === 'granted';
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
    var body = chats[pub].uuid ? `${chats[pub].participantProfiles[info.from].name}: ${msg.text}` : msg.text;
    body = truncateString(body, 50);
    var desktopNotification = new Notification(getDisplayName(pub), {
      icon: 'img/icon128.png',
      body,
      silent: true
    });
    desktopNotification.onclick = function() {
      showChat(pub);
      window.focus();
    };
  }
}

var cropper;
function renderProfilePhotoSettings() {
  $('#profile-photo-error').toggleClass('hidden', true);
  var files = $('#profile-photo-input')[0].files;
  if (files && files.length) {
    var file = files[0];
    /*
    if (file.size > 1024 * 200) {
      $('#profile-photo-error').toggleClass('hidden', false);
      return console.error('file too big');
    }
    */
    // show preview
    $('#current-profile-photo').hide();
    $('#add-profile-photo').hide();
    getBase64(file).then(base64 => {
      var previewEl = $('#profile-photo-preview');
      previewEl.attr('src', base64);
      $('#profile-photo-preview').toggleClass('hidden', false);
      $('#cancel-profile-photo').toggleClass('hidden', false);
      $('#use-profile-photo').toggleClass('hidden', false);
      cropper = new Cropper(previewEl[0], {
        aspectRatio:1,
        autoCropArea: 1,
        viewMode: 1,
        background: false,
        zoomable: false
      });
    });
  } else {
    cropper && cropper.destroy();
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
  var canvas = cropper.getCroppedCanvas();
  var resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = resizedCanvas.height = Math.min(canvas.width, 800);
  pica().resize(canvas, resizedCanvas).then(result => {
    var src = resizedCanvas.toDataURL('image/jpeg');
    // var src = $('#profile-photo-preview').attr('src');
    gun.user().get('profile').get('photo').put(src);
    $('#current-profile-photo').attr('src', src);
    $('#profile-photo-input').val('');
    renderProfilePhotoSettings();
  });
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
  activeProfile = pub;
  $('#profile .profile-photo-container').hide();
  var qrCodeEl = $('#profile-page-qr');
  qrCodeEl.empty();
  $('#profile-nickname-their').val('');
  $('#profile').show();
  addUserToHeader(pub);
  setTheirOnlineStatus(pub);
  renderGroupParticipants(pub);
  gun.user(pub).get('profile').get('photo').on(photo => {
    $('#profile .profile-photo-container').show();
    $('#profile .profile-photo').attr('src', photo);
  });
  $('#profile .profile-about').toggle(chats[pub] && chats[pub].about && chats[pub].about.length > 0);
  $('#profile .profile-about-content').empty();
  $('#profile .profile-about-content').text(chats[pub] && chats[pub].about);
  const link = chats[pub] && chats[pub].getSimpleLink();
  $('#profile .add-friend').off().on('click', () => {
    console.log('add friend');
  });
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
  $('#profile-group-name').not(':focus').val(chats[pub] && chats[pub].name);
  $('#profile-group-name').off().on('input', event => {
    var name = event.target.value;
    chats[pub].put('name', name);
  });
  $('.profile-nicknames').toggle(pub !== key.pub);
  $('#profile-nickname-my-container').toggle(!chats[pub].uuid);
  $('#profile-nickname-their').not(':focus').val(chats[pub] && chats[pub].theirNickname);
  $('#profile-nickname-my').text(chats[pub] && chats[pub].myNickname && chats[pub].myNickname.length ? chats[pub].myNickname : '');
  $('#profile-nickname-their').off().on('input', event => {
    var nick = event.target.value;
    chats[pub].put('nickname', nick);
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
  $('#profile-group-settings').toggle(!!(chats[pub] && chats[pub].uuid));
}

var newGroupParticipant;
$('#profile-add-participant').on('input', event => {
  var val = $(event.target).val();
  if (val.length < 30) {
    return;
  }
  var s = val.split('?');
  if (s.length !== 2) { return; }
  var pub = getUrlParameter('chatWith', s[1]);
  $('#profile-add-participant-input').hide();
  if (pub) {
    $('#profile-add-participant-candidate').remove();
    var identicon = getIdenticon(pub, 40).css({'margin-right':15});
    var nameEl = $('<span>');
    gun.user(pub).get('profile').get('name').on(name => nameEl.text(name));
    var el = $('<p>').css({display:'flex', 'align-items': 'center'}).attr('id', 'profile-add-participant-candidate');
    var addBtn = $('<button>').css({'margin-left': 15}).text('Add').click(() => {
      if (newGroupParticipant) {
        chats[activeProfile].addParticipant(newGroupParticipant);
        newGroupParticipant = null;
        $('#profile-add-participant-input').val('').show();
        $('#profile-add-participant-candidate').remove();
      }
    });
    var removeBtn = $('<button>').css({'margin-left': 15}).text('Cancel').click(() => {
      el.remove();
      $('#profile-add-participant-input').val('').show();
      newGroupParticipant = null;
    });
    el.append(identicon);
    el.append(nameEl);
    el.append(addBtn);
    el.append(removeBtn);
    newGroupParticipant = pub;
    $('#profile-add-participant-input').after(el);
  }
  $(event.target).val('');
});

function renderGroupParticipants(pub) {
  if (!(chats[pub] && chats[pub].uuid)) {
    $('#profile-group-settings').hide();
    return;
  } else {
    $('#profile-group-settings').show();
  }
  $('#profile-group-participants').empty();
  var keys = Object.keys(chats[pub].participantProfiles);
  var me = chats[pub].participantProfiles[key.pub];
  if (me && me.permissions) {
    $('#profile-add-participant').toggle(me.permissions.admin);
    $('#profile-group-name-container').toggle(me.permissions.admin);
  }
  keys.forEach(k => {
    var profile = chats[pub].participantProfiles[k];
    var identicon = getIdenticon(k, 40).css({'margin-right':15});
    var nameEl = $('<span>');
    gun.user(k).get('profile').get('name').on(name => nameEl.text(name));
    var el = $('<p>').css({display:'flex', 'align-items': 'center', 'cursor':'pointer'});
    var removeBtn = $('<button>').css({'margin-right': 15}).text('Remove').click(() => {
      el.remove();
      // TODO remove group participant
    });
    //el.append(removeBtn);
    el.append(identicon);
    el.append(nameEl);
    if (profile.permissions && profile.permissions.admin) {
      el.append($('<small>').text('admin').css({'margin-left': 5}));
    }
    el.click(() => showProfile(k));
    $('#profile-group-participants').append(el);
  });
}

function addUserToHeader(pub) {
  $('#header-content').empty();
  var nameEl = $('<div class="name"></div>');
  if (pub === key.pub && activeProfile !== pub) {
    nameEl.html("📝<b>Note to Self</b>");
  } else if (chats[pub]) {
    nameEl.text(getDisplayName(pub));
  }
  nameEl.show();

  var identicon = getIdenticon(pub, 40);
  var img = identicon.children('img').first();
  img.attr('height', 40).attr('width', 40);
  $("#header-content").append($('<div>').addClass('identicon-container').append(identicon));
  var textEl = $('<div>').addClass('text');
  textEl.append(nameEl);
  if (chats[pub] && chats[pub].uuid) {
    var t = Object.keys(chats[pub].participantProfiles).map(p => chats[pub].participantProfiles[p].name).join(', ');
    var namesEl = $('<small>').addClass('participants').text(t);
    textEl.append(namesEl);
  }
  textEl.append($('<small>').addClass('last-seen'));
  textEl.append($('<small>').addClass('typing-indicator').text('typing...'));
  $("#header-content").append(textEl);
  textEl.on('click', () => showProfile(pub));
  var videoCallBtn = $(`<a class="tooltip"><span class="tooltiptext">Video call</span><svg enable-background="new 0 0 50 50" id="Layer_1" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="none" style="height:24px;width:24px"/><polygon fill="none" points="49,14 36,21 36,29   49,36 " stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/><path d="M36,36c0,2.209-1.791,4-4,4  H5c-2.209,0-4-1.791-4-4V14c0-2.209,1.791-4,4-4h27c2.209,0,4,1.791,4,4V36z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/></svg></a>`).attr('id', 'start-video-call').css({width:24, height:24, color: 'var(--msg-form-button-color)'});
  videoCallBtn.click(() => callingInterval ? null : callUser(pub));
  var voiceCallBtn = $('<a><svg enable-background="new 0 0 50 50" style="height:20px;width:20px" id="Layer_1" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="none" height="50" width="50"/><path d="M30.217,35.252c0,0,4.049-2.318,5.109-2.875  c1.057-0.559,2.152-0.7,2.817-0.294c1.007,0.616,9.463,6.241,10.175,6.739c0.712,0.499,1.055,1.924,0.076,3.32  c-0.975,1.396-5.473,6.916-7.379,6.857c-1.909-0.062-9.846-0.236-24.813-15.207C1.238,18.826,1.061,10.887,1,8.978  C0.939,7.07,6.459,2.571,7.855,1.595c1.398-0.975,2.825-0.608,3.321,0.078c0.564,0.781,6.124,9.21,6.736,10.176  c0.419,0.66,0.265,1.761-0.294,2.819c-0.556,1.06-2.874,5.109-2.874,5.109s1.634,2.787,7.16,8.312  C27.431,33.615,30.217,35.252,30.217,35.252z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="4"/></svg></a>').css({width:20, height:20, 'margin-right': 20});
  voiceCallBtn.click(() => callingInterval ? stopCalling(pub) : callUser(pub));
  //$("#header-content").append(voiceCallBtn);
  $("#header-content").append(videoCallBtn);
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
  var chatListEl = $('.chat-item[data-pub="' + pub +'"]');
  var unseenCountEl = chatListEl.find('.unseen');
  if (chats[pub].unseen > 0) {
    chatListEl.addClass('has-unseen');
    unseenCountEl.text(chats[pub].unseen);
    unseenCountEl.show();
  } else {
    chatListEl.removeClass('has-unseen');
    unseenCountEl.hide();
  }
  setUnseenTotal();
}

function setTheirOnlineStatus(pub) {
  if (!chats[pub]) return;
  var online = chats[pub].online;
  if (online && (activeChat === pub || activeProfile === pub)) {
    if (online.isOnline) {
      $('#header-content .last-seen').text('online');
    } else if (online.lastActive) {
      var d = new Date(online.lastActive);
      var lastSeenText = iris.util.getDaySeparatorText(d, d.toLocaleDateString({dateStyle:'short'}));
      if (lastSeenText === 'today') {
        lastSeenText = iris.util.formatTime(d);
      } else {
        lastSeenText = iris.util.formatDate(d);
      }
      $('#header-content .last-seen').text('last active ' + lastSeenText);
    }
  }
}

function showChat(pub) {
  if (!pub) {
    return;
  }
  resetView();
  activeChat = pub;
  if (!Object.prototype.hasOwnProperty.call(chats, pub)) {
    newChat(pub);
  }
  var chatListEl = $('.chat-item[data-pub="' + pub +'"]');
  chatListEl.toggleClass('active', true);
  chatListEl.find('.unseen').empty().hide();
  $("#message-list").empty();
  $("#message-view").show();
  $(".message-form").show();
  if (!iris.util.isMobile) {
    $("#new-msg").focus();
  }
  var isTyping = false;
  var getIsTyping = () => $('#new-msg').val().length > 0;
  var setTyping = () => chats[pub].setTyping(getIsTyping());
  var setTypingThrottled = _.throttle(setTyping, 1000);
  $('#new-msg').val(chats[pub].msgDraft);
  $('#new-msg').off().on('input', () => {
    if (isTyping === getIsTyping()) {
      setTypingThrottled();
    } else {
      setTyping();
    }
    isTyping = getIsTyping();
    chats[pub].msgDraft = $('#new-msg').val();
  });
  $(".message-form form").off().on('submit', event => {
    event.preventDefault();
    chats[pub].msgDraft = null;
    var text = $('#new-msg').val();
    if (!text.length && !chats[pub].attachments) { return; }
    chats[pub].setTyping(false);
    var msg = {text};
    if (chats[pub].attachments) {
      msg.attachments = chats[pub].attachments;
    }
    chats[pub].send(msg);
    closeAttachmentsPreview();
    $('#new-msg').val('');
  });
  changeChatUnseenCount(pub, 0);
  addUserToHeader(pub);
  var msgs = Object.values(chats[pub].messages);
  msgs.forEach(msg => addMessage(msg, pub));
  sortMessagesByTime();
  $('#message-view').scroll(() => {
    if ($('#attachment-preview:visible').length) { return; }
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
  scrollToMessageListBottom();
  chats[pub].setMyMsgsLastSeenTime();
  setTheirOnlineStatus(pub);
  setDeliveredCheckmarks(pub);
}

function getIdenticon(pub, width) {
  var el = $('<div>').width(width).height(width).addClass('identicon');
  var identicon = $(new iris.Attribute({type: 'keyID', value: pub}).identicon({width, showType: false}));
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
  $('.from-separator').remove();
  var now = new Date();
  var nowStr = now.toLocaleDateString();
  var previousDateStr;
  var previousFrom;
  sorted.each(function() {
    var date = $(this).data('time');
    if (!date) { return; }
    var dateStr = date.toLocaleDateString();
    if (dateStr !== previousDateStr) {
      var separatorText = iris.util.getDaySeparatorText(date, dateStr, now, nowStr);
      $(this).before($('<div>').text(separatorText).addClass('day-separator'));
    }
    previousDateStr = dateStr;

    var from = $(this).data('from');
    if (previousFrom && (from !== previousFrom)) {
      $(this).before($('<div>').addClass('from-separator'));
      $(this).find('small').show();
    } else {
      $(this).find('small').hide();
    }
    previousFrom = from;
  });
}

var seenIndicatorHtml = '<span class="seen-indicator"><svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg></span>';

function addMessage(msg, chatId) {
  var escaped = $('<div>').text(msg.text).html();
  var textEl = $('<div class="text"></div>').html(autolinker.link(escaped));
  var seenHtml = msg.selfAuthored ? ' ' + seenIndicatorHtml : '';
  var msgContent = $(
    '<div class="msg-content"><div class="time">' + iris.util.formatTime(msg.time) + seenHtml + '</div></div>'
  );
  msgContent.prepend(textEl);
  if (msg.attachments) {
    msg.attachments.forEach(a => {
      if (a.type.indexOf('image') === 0 && a.data) {
        var img = $('<img>').attr('src', a.data).click(e => { openAttachmentsGallery(msg, e); });
        msgContent.prepend(img);
        img.one('load', scrollToMessageListBottom);
      }
    })
  }
  if (chats[chatId].uuid && !msg.info.selfAuthored) {
    var profile = chats[chatId].participantProfiles[msg.info.from];
    var name = profile && profile.name;
    if (name) {
      var nameEl = $('<small>').text(name).css({color: profile.color, 'margin-bottom':2,display:'block','font-weight':'bold'});
      msgContent.prepend(nameEl);
    }
  }
  if (msg.text.length === 2 && isEmoji(msg.text)) {
    textEl.toggleClass('emoji-only', true);
  } else {
    textEl.html(highlightEmoji(textEl.html()));
  }
  msgEl = $('<div class="msg"></div>').append(msgContent);
  msgEl.data('time', msg.time);
  msgEl.data('from', msg.info.from);
  msgEl.toggleClass('our', msg.selfAuthored ? true : false);
  msgEl.toggleClass('their', msg.selfAuthored ? false : true);
  $("#message-list").append(msgEl); // TODO: jquery insertAfter element with smaller timestamp
}

function deleteChat(pub) {
  iris.Channel.deleteChannel(gun, key, pub);
  if (activeChat === pub) {
    showNewChat();
    showMenu();
  }
  delete chats[pub];
  $('.chat-item[data-pub="' + pub +'"]').remove();
}

function getDisplayName(pub) {
  var displayName;
  if (chats[pub].theirNickname && chats[pub].theirNickname.length) {
    displayName = chats[pub].theirNickname;
    if (chats[pub].name && chats[pub].name.length) {
      displayName = displayName + ' (' + chats[pub].name + ')';
    }
  } else {
    displayName = chats[pub].name;
  }
  return displayName || '';
}

function newChat(pub, chatLink) {
  if (!pub || Object.prototype.hasOwnProperty.call(chats, pub)) {
    return;
  }
  const channel = new iris.Channel({gun, key, chatLink: chatLink, participants: pub});
  addChat(channel);
}

var askForPeers = _.once(pub => {
  _.defer(() => {
    gun.user(pub).get('peers').once().map().on(peer => {
      if (peer && peer.url) {
        var peerCountBySource = _.countBy(peers, p => p.from);
        var peerSourceCount = Object.keys(peerCountBySource).length;
        if (!peerCountBySource[pub]) {
          peerSourceCount += 1;
        }
        var maxPeersFromSource = MAX_PEER_LIST_SIZE / peerSourceCount;
        addPeer({url: peer.url, connect: true, from: pub});
        while (Object.keys(peers).length > MAX_PEER_LIST_SIZE) {
          _.each(Object.keys(peerCountBySource), source => {
            if (peerCountBySource[source] > maxPeersFromSource) {
              delete peers[_.sample(Object.keys(peers))];
              peerCountBySource[source] -= 1;
            }
          });
        }
      }
    });
  });
});

var scrollToMessageListBottom = _.throttle(() => {
  $('#message-view').scrollTop($('#message-view')[0].scrollHeight - $('#message-view')[0].clientHeight);
}, 100, true);

function addChat(channel) {
  var pub = channel.getId();
  if (chats[pub]) { return; }
  chats[pub] = channel;
  $('#welcome').remove();
  var el = $('<div class="chat-item"><div class="text"><div><span class="name"></span><small class="latest-time"></small></div> <small class="typing-indicator"></small> <small class="latest"></small> <span class="unseen"></span></div></div>');
  el.attr('data-pub', pub);
  var latestEl = el.find('.latest');
  var typingIndicator = el.find('.typing-indicator').text('Typing...');
  chats[pub].getMessages((msg, info) => {
    chats[pub].messages[msg.time] = msg;
    msg.info = info;
    msg.selfAuthored = info.selfAuthored;
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
      var text = msg.text || '';
      if (msg.attachments) {
        text = '[attachment]' + (text.length ? ': ' + text : '');
      } else {
        text = msg.text;
      }
      if (chats[pub].uuid && !msg.selfAuthored && msg.info.from && chats[pub].participantProfiles[msg.info.from].name) {
        text = chats[pub].participantProfiles[msg.info.from].name + ': ' + text;
      }
      var now = new Date();
      var latestTimeText = iris.util.getDaySeparatorText(msg.time, msg.time.toLocaleDateString({dateStyle:'short'}));
      if (latestTimeText === 'today') { latestTimeText = iris.util.formatTime(msg.time); }
      latestEl.text(text);
      latestEl.html(highlightEmoji(latestEl.html()));
      if (info.selfAuthored) {
        latestEl.prepend($(seenIndicatorHtml));
        setLatestSeen(pub);
        setLatestCheckmark(pub);
      }
      el.find('.latest-time').text(latestTimeText);
      el.data('latestTime', msg.time);
      sortChatsByLatest();
    }
    if (activeChat === pub) {
      addMessage(msg, pub);
      sortMessagesByTime(); // this is slow if message history is loaded while chat active
      if (chats[pub].latest.time === msg.time && areWeOnline) {
        chats[pub].setMyMsgsLastSeenTime();
      }
      if (chats[pub].theirLastSeenTime) {
        $('#not-seen-by-them').slideUp();
      } else if (!chats[pub].uuid) {
        $('#not-seen-by-them').slideDown();
      }
      scrollToMessageListBottom();
    }
    notify(msg, info, pub);
  });
  changeChatUnseenCount(pub, 0);
  chats[pub].messages = chats[pub].messages || [];
  chats[pub].identicon = getIdenticon(pub, 49);
  el.prepend($('<div>').addClass('identicon-container').append(chats[pub].identicon));
  chats[pub].onTheir('nickname', (nick) => {
    chats[pub].myNickname = nick;
    $('#profile-nickname-my').text(nick && nick.length ? nick : '');
    $('#profile-nickname-my-container').toggle(!!(nick && nick.length));
  });
  chats[pub].onMy('nickname', (nick) => {
    chats[pub].theirNickname = nick;
    if (pub !== key.pub) {
      el.find('.name').text(truncateString(getDisplayName(pub), 20));
    }
    if (pub === activeChat || pub === activeProfile) {
      addUserToHeader(pub);
    }
  });
  el.click(() => showChat(pub));
  $(".chat-list").append(el);
  chats[pub].getTheirMsgsLastSeenTime(time => {
    if (chats[pub]) {
      chats[pub].theirLastSeenTime = new Date(time);
      lastSeenTimeChanged(pub);
    }
  });
  chats[pub].getMyMsgsLastSeenTime(time => {
    chats[pub].myLastSeenTime = new Date(time);
    if (chats[pub].latest && chats[pub].myLastSeenTime >= chats[pub].latest.time) {
      changeChatUnseenCount(pub, 0);
    }
    askForPeers(pub); // TODO: this should be done only if we have a chat history or friendship with them
  });
  chats[pub].getTyping(isTyping => {
    if (activeChat === pub) {
      $('#header-content .last-seen').toggle(!isTyping);
      $('#header-content .typing-indicator').toggle(isTyping);
    }
    typingIndicator.toggle(isTyping);
    latestEl.toggle(!isTyping);
  });
  chats[pub].online = {};
  iris.Channel.getOnline(gun, pub, (online) => {
    if (chats[pub]) {
      chats[pub].online = online;
      setTheirOnlineStatus(pub);
      setDeliveredCheckmarks(pub);
    }
  });
  function setName(name, from) {
    if (chats[pub].uuid) {
      var profile = chats[pub].participantProfiles[from];
      if (profile && !(profile.permissions && profile.permissions.admin)) {
        return;
      }
    }
    if (name && typeof name === 'string') {
      chats[pub].name = name;
    }
    if (pub === key.pub) {
      el.find('.name').html("📝<b>Note to Self</b>");
    } else {
      el.find('.name').text(truncateString(getDisplayName(pub), 20));
    }
    if (pub === activeChat || pub === activeProfile) {
      addUserToHeader(pub);
    }
    if (pub === activeProfile) {
      $('#profile-group-name').not(':focus').val(name);
    }
  }
  function setAbout(about) {
    chats[pub].about = about;
    if (activeProfile === pub) {
      $('#profile .profile-about').toggle(about && about.length > 0);
      $('#profile .profile-about-content').text(about);
    }
  }
  if (chats[pub].uuid) {
    chats[pub].on('name', setName);
    chats[pub].on('about', setAbout);
    chats[pub].participantProfiles = {};
    var participants = chats[pub].getParticipants();
    chats[pub].onMy('participants', participants => {
      if (typeof participants === 'object') {
        var keys = Object.keys(participants);
        keys.forEach((k, i) => {
          if (chats[pub].participantProfiles[k]) { return; }
          var hue = 360 / Math.max(keys.length, 2) * i; // TODO use css filter brightness
          chats[pub].participantProfiles[k] = {permissions: participants[k], color: `hsl(${hue}, 98%, ${isDarkMode ? 80 : 33}%)`};
          gun.user(k).get('profile').get('name').on(name => {
            chats[pub].participantProfiles[k].name = name;
          });
        });
      }
      if (activeProfile === pub) {
        renderGroupParticipants(pub);
      }
      if (activeChat === pub) {
        addUserToHeader(pub);
      }
    });
    var isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    gun.user(pub).get('profile').get('name').on(setName);
    gun.user(pub).get('profile').get('about').on(setAbout);
  }
  chats[pub].onTheir('call', call => onCallMessage(pub, call));
}

function setLatestSeen(pub) {
  if (chats[pub].latest) {
    $('.chat-item[data-pub="' + pub +'"]').toggleClass('seen', chats[pub].latest.time <= chats[pub].theirLastSeenTime);
  }
}

function setLatestCheckmark(pub) {
  var latestTime = chats[pub].latest && chats[pub].latest.time;
  var lastActive = chats[pub].online && chats[pub].online.lastActive && new Date(chats[pub].online.lastActive);
  if (latestTime && lastActive) {
    $('.chat-item[data-pub="' + pub +'"]').toggleClass('delivered', latestTime <= lastActive);
  }
}

function setDeliveredCheckmarks(pub) {
  var online = chats[pub].online;
  if (online && online.lastActive) {
    var lastActive = new Date(online.lastActive);
    if (activeChat === pub) {
      $('.msg.our:not(.delivered)').each(function() {
        var el = $(this);
        if (el.data('time') <= lastActive) {
          el.toggleClass('delivered', true);
        }
      });
    }
    setLatestCheckmark(pub);
  }
}

function lastSeenTimeChanged(pub) {
  setLatestSeen(pub);
  setDeliveredCheckmarks(pub);
  if (pub === activeChat) {
    if (chats[pub].theirLastSeenTime) {
      $('#not-seen-by-them').slideUp();
      $('.msg.our:not(.seen)').each(function() {
        var el = $(this);
        if (el.data('time') <= chats[pub].theirLastSeenTime) {
          el.toggleClass('seen', true);
        }
      });
      // set seen msgs
    } else {
      if (!chats[pub].uuid && $('.msg.our').length) {
        $('#not-seen-by-them').slideDown();
      }
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
