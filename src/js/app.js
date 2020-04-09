Gun.log.off = true;
var MAX_PEER_LIST_SIZE = 10;
var MAX_CONNECTED_PEERS = iris.util.isElectron ? 4 : 2;
var peers = getPeers();
var randomPeers = _.sample(
  Object.keys(
    _.pick(peers, p => { return p.enabled; })
  ), MAX_CONNECTED_PEERS
);
var gun = Gun({ peers: randomPeers });
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
var callSound = new Audio('./ring.mp3');
callSound.loop = true;
var chat = gun.get('converse/' + location.hash.slice(1));
var chats = {};
var autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});
var activeChat;
var activeProfile;
var onlineTimeout;
var loginTime;
var key;
var latestChatLink;
var desktopNotificationsEnabled;
var areWeOnline;
var unseenTotal;
var activeCall;
var callTimeout;
var callingInterval;
var userMediaStream;
var localVideo = $('<video>').attr('autoplay', true).attr('playsinline', true).attr('muted', true).css({width:'50%', 'max-height': '60%'});
var remoteVideo = $('<video>').attr('autoplay', true).attr('playsinline', true).css({width:'50%', 'max-height': '60%'});

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
  var chatWith = getUrlParameter('chatWith');
  if (chatWith) {
    newChat(chatWith, window.location.href);
    showChat(chatWith);
    window.history.pushState({}, "Iris Chat", "/"+window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]); // remove param
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
      $('.user-info .user-name').text(truncateString(name, 20));
      var el = $('#settings-name');
      if (!el.is(':focus')) {
        $('#settings-name').val(name);
      }
    }
  });
  gun.user().get('profile').get('about').on(about => {
    var el = $('#settings-about');
    if (!el.is(':focus')) {
      $('#settings-about').val(about || '');
    }
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
        $('<small>').text('from ' + ((chats[peer.from] && chats[peer.from].name) || truncateString(peer.from, 10)))
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

$('#desktop-application-about').toggle(!iris.util.isMobile && !iris.util.isElectron);

$('#paste-chat-link').on('input', event => {
  var val = $(event.target).val();
  if (val.length < 30 || val.indexOf('chatWith') === -1) {
    return;
  }
  var s = val.split('?');
  if (s.length !== 2) { return; }
  var pub = getUrlParameter('chatWith', s[1]);
  newChat(pub, val);
  showChat(pub);
  $(event.target).val('');
});

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
  $('#profile-page-qr').empty();
  $('#private-key-qr').remove();
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
}

$('#show-create-account').click(showCreateAccount);
function showCreateAccount(e) {
  e.preventDefault();
  $('#privkey-qr-video').hide();
  $('#create-account').show();
  $('#existing-account-login').hide();
  cleanupScanner();
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
  $('#profile').show();
  addUserToHeader(pub);
  setTheirOnlineStatus(pub);
  gun.user(pub).get('profile').get('photo').on(photo => {
    $('#profile .profile-photo-container').show();
    $('#profile .profile-photo').attr('src', photo);
  });
  gun.user(pub).get('profile').get('about').on(about => {
    $('#profile .profile-about').toggle(about && about.length > 0);
    $('#profile .profile-about').text(about);
  });
  const link = getUserChatLink(pub);
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

function onCallMessage(pub, call) {
  if (call && call.time) {
    var d = new Date(call.time);
    if (new Date() - d > 5000) {
      console.log('ignoring old call from', pub);
      return;
    }
    if (call.offer) {
      console.log('incoming call from', pub, call);
      if (!activeCall && $('#incoming-call').length === 0) {
        activeCall = pub;
        var incomingCallEl = $('<div>')
          .attr('id', 'incoming-call')
          .text(`Incoming call from ${chats[pub].name}`)
          .css({position:'fixed', right:0, bottom: 0, height:200, width: 200, 'text-align': 'center', background: '#000', color: '#fff', padding: 15});
        var answer = $('<button>').text('answer').css({display:'block',margin: '15px auto'});
        var reject = $('<button>').text('reject').css({display:'block',margin: '15px auto'});
        answer.click(() => answerCall(pub, call));
        reject.click(() => rejectCall(pub, call));
        incomingCallEl.append(answer);
        incomingCallEl.append(reject);
        $('body').append(incomingCallEl)
        callSound.play();
      }
      clearTimeout(callTimeout);
      callTimeout = setTimeout(() => {
        $('#incoming-call').remove();
        activeCall = null;
        callSound.pause();
      }, 5000);
    } else if (call.answer) {
      stopCalling(pub);
      chats[pub].pc.setRemoteDescription({type: "answer", sdp: call.answer});
      console.log('call answered by', pub);
      createCallElement(pub);
      chats[pub].pc.ontrack = (event) => {
        console.log('ontrack', event);
        if (remoteVideo[0].srcObject !== event.streams[0]) {
          remoteVideo[0].srcObject = event.streams[0];
          remoteVideo[0].onloadedmetadata = function(e) {
            remoteVideo[0].play();
          };
          console.log('received remote stream', event);
        }
      };
    }
  } else {
    //stopCalling(pub);
    activeCall = null;
    callSound.pause();
    clearTimeout(callTimeout);
    $('#incoming-call').remove();
  }
}

async function addStreamToPeerConnection(pc) {
  var constraints = {
    audio: true,
    video: true
  };
  userMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  userMediaStream.getTracks().forEach(track => {
    pc.addTrack(track, userMediaStream);
  });
  localVideo[0].srcObject = userMediaStream;
  localVideo[0].onloadedmetadata = function(e) {
    localVideo[0].play();
  };
  localVideo.attr('disabled', true);
}

async function callUser(pub, video = true) {
  if (callingInterval) { return; }

  var config = {iceServers: [{urls: "stun:stun.1.google.com:19302"}]};
  var pc = chats[pub].pc = new RTCPeerConnection(config);
  pc.oniceconnectionstatechange = e => console.log(pc.iceConnectionState);

  await addStreamToPeerConnection(pc);

  await pc.setLocalDescription(await pc.createOffer({
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }));
  pc.onicecandidate = ({candidate}) => {
    if (candidate) return;
    if (!callingInterval) {
      console.log('calling', pub);
      var call = () => chats[pub].put('call', {
        time: new Date().toISOString(),
        type: video ? 'video' : 'voice',
        offer: pc.localDescription.sdp,
      });
      call();
      callingInterval = setInterval(call, 1000);
      var activeCallEl = $('<div>')
        .css({position:'fixed', right:0, bottom: 0, height:200, width: 200, 'text-align': 'center', background: '#000', color: '#fff', padding: 15})
        .text(`calling ${chats[pub].name}`)
        .attr('id', 'outgoing-call');
      var cancelButton = $('<button>')
        .css({display:'block', margin: '15px auto'})
        .text('cancel')
        .click(() => cancelCall(pub));
      activeCallEl.append(cancelButton);
      activeCallEl.append(localVideo);
      activeCallEl.append(remoteVideo);
      $('body').append(activeCallEl);
    }
  };
}

function cancelCall(pub) {
  userMediaStream.getTracks().forEach(track => track.stop());
  stopCalling(pub);
}

function stopCalling(pub) {
  $('#outgoing-call').remove();
  $('#start-video-call').text('video');
  clearInterval(callingInterval);
  callingInterval = null;
  chats[pub].put('call', null);
}

function endCall(pub) {
  chats[pub].pc.close();
  userMediaStream.getTracks().forEach(track => track.stop());
  $('#active-call').remove();
  chats[pub].put('call', null);
}

function rejectCall(pub) {
  callSound.pause();
}

async function createCallElement(pub) {
  var activeCallEl = $('<div>')
    .css({position:'fixed', right:0, bottom: 0, height:300, width: 400, 'max-width': '100%', 'text-align': 'center', background: '#000', color: '#fff', padding: '15px 0'})
    .attr('id', 'active-call');
  $('body').append(activeCallEl);
  activeCallEl.append($('<div>').text(`on call with ${chats[pub].name}`).css({'margin-bottom': 5}));
  activeCallEl.append($('<button>').text('end call').click(() => endCall(pub)).css({display:'block', margin: '15px auto'}));
  $(activeCallEl).append(localVideo);
  $(activeCallEl).append(remoteVideo);
}

async function answerCall(pub, call) {
  callSound.pause();
  var config = {iceServers: [{urls: "stun:stun.1.google.com:19302"}]};
  var pc = chats[pub].pc = new RTCPeerConnection(config);
  await addStreamToPeerConnection(pc);
  pc.oniceconnectionstatechange = e => console.log(pc.iceConnectionState);
  pc.ontrack = (event) => {
    console.log('ontrack', event);
    if (remoteVideo[0].srcObject !== event.streams[0]) {
      remoteVideo[0].srcObject = event.streams[0];
      remoteVideo[0].onloadedmetadata = function(e) {
        remoteVideo[0].play();
      };
      console.log('received remote stream', event);
    }
  };

  await pc.setRemoteDescription({type: "offer", sdp: call.offer});
  await pc.setLocalDescription(await pc.createAnswer({
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }));
  pc.onicecandidate = ({candidate}) => {
    if (candidate) return;
    chats[pub].put('call', {
      time: new Date().toISOString(),
      answer: pc.localDescription.sdp,
    });
    console.log('answered call from', pub, 'with', pc.localDescription.sdp);
    createCallElement(pub);
  };
}

function addUserToHeader(pub) {
  $('#header-content').empty();
  var nameEl = $('<div class="name"></div>');
  if (chats[pub] && chats[pub].name) {
    nameEl.text(truncateString(chats[pub].name, 30));
    nameEl.show();
  }
  var identicon = getIdenticon(pub, 40);
  var img = identicon.children('img').first();
  img.attr('height', 40).attr('width', 40);
  $("#header-content").append($('<div>').addClass('identicon-container').append(identicon));
  var textEl = $('<div>').addClass('text');
  textEl.append(nameEl);
  textEl.append($('<small>').addClass('last-seen'));
  textEl.append($('<small>').addClass('typing-indicator').text('typing...'));
  $("#header-content").append(textEl);
  textEl.on('click', () => showProfile(pub));
  var videoCallBtn = $('<button>video</button>').attr('id', 'start-video-call');
  videoCallBtn.click(() => callingInterval ? stopCalling(pub) : callUser(pub));
  var voiceCallBtn = $('<button>voice</button>');
  voiceCallBtn.click(() => callUser(pub, false));
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
  var el = $('.chat-item[data-pub="' + pub +'"] .unseen');
  if (chats[pub].unseen > 0) {
    el.text(chats[pub].unseen);
    el.show();
  } else {
    el.hide();
  }
  setUnseenTotal();
}

function setTheirOnlineStatus(pub) {
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
  $('#new-msg').off().on('input', _.throttle(() => {
    chats[pub].setTyping($('#new-msg').val().length > 0);
  }, 1000));
  $(".message-form form").off().on('submit', event => {
    event.preventDefault();
    var text = $('#new-msg').val();
    if (!text.length) { return; }
    chats[pub].setTyping(false);
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
  var now = new Date();
  var nowStr = now.toLocaleDateString();
  var previousDateStr;
  sorted.each(function() {
    var date = $(this).data('time');
    if (!date) { return; }
    var dateStr = date.toLocaleDateString();
    if (dateStr !== previousDateStr) {
      var separatorText = iris.util.getDaySeparatorText(date, dateStr, now, nowStr);
      $(this).before($('<div>').text(separatorText).addClass('day-separator'));
    }
    previousDateStr = dateStr;
  });
}

var seenIndicatorHtml = '<span class="seen-indicator"><svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg></span>';

function addMessage(msg) {
  var escaped = $('<div>').text(msg.text).html();
  var textEl = $('<div class="text"></div>').html(autolinker.link(escaped));
  var seenHtml = msg.selfAuthored ? ' ' + seenIndicatorHtml : '';
  var msgContent = $(
    '<div class="msg-content"><div class="time">' + iris.util.formatTime(msg.time) + seenHtml + '</div></div>'
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
  iris.Channel.deleteChannel(gun, key, pub);
  if (activeChat === pub) {
    showNewChat();
    showMenu();
  }
  delete chats[pub];
  $('.chat-item[data-pub="' + pub +'"]').remove();
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

function addChat(channel) {
  var participants = channel.getParticipants();
  if (participants.length > 1) {
    return; // group chats not supported yet
  }
  var pub = participants[0];
  if (chats[pub]) { return; }
  chats[pub] = channel;
  $('#welcome').remove();
  var el = $('<div class="chat-item"><div class="text"><div><span class="name"></span><small class="latest-time"></small></div> <small class="typing-indicator"></small> <small class="latest"></small> <span class="unseen"></span></div></div>');
  el.attr('data-pub', pub);
  var latestEl = el.find('.latest');
  var typingIndicator = el.find('.typing-indicator').text('Typing...');
  chats[pub].getMessages((msg, info) => {
    chats[pub].messages[msg.time] = msg;
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
      var text = truncateString(msg.text, 100);
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
      addMessage(msg);
      sortMessagesByTime(); // this is slow if message history is loaded while chat active
      if (chats[pub].latest.time === msg.time && areWeOnline) {
        chats[pub].setMyMsgsLastSeenTime();
      }
      if (chats[pub].theirLastSeenTime) {
        $('#not-seen-by-them').slideUp();
      } else {
        $('#not-seen-by-them').slideDown();
      }
      $('#message-view').scrollTop($('#message-view')[0].scrollHeight - $('#message-view')[0].clientHeight);
    }
    notify(msg, info, pub);
  });
  changeChatUnseenCount(pub, 0);
  chats[pub].messages = chats[pub].messages || [];
  chats[pub].identicon = getIdenticon(pub, 49);
  el.prepend($('<div>').addClass('identicon-container').append(chats[pub].identicon));
  gun.user(pub).get('profile').get('name').on(name => {
    if (name && typeof name === 'string') {
      chats[pub].name = name;
      el.find('.name').text(truncateString(name, 20));
      if (pub === activeChat) {
        addUserToHeader(pub);
      }
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
      if ($('.msg.our').length) {
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
