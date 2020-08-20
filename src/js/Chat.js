import {publicState, localState, showMenu, resetView, activeChat, activeProfile} from './Main.js';
import { translate as t } from './Translation.js';
import Helpers from './Helpers.js';
import Notifications from './Notifications.js';
import PeerManager from './PeerManager.js';
import Session from './Session.js';
import Gallery from './Gallery.js';
import Profile from './Profile.js';
import QRScanner from './QRScanner.js';
import VideoCall from './VideoCall.js';

const chats = window.chats = {};
const notificationServiceUrl = 'https://iris-notifications.herokuapp.com/notify';

function showChat(pub) {
  if (!pub) {
    return;
  }

  resetView();
  localState.get('activeChat').put(pub);
  if (!Object.prototype.hasOwnProperty.call(chats, pub)) {
    newChat(pub);
  }
  var chatListEl = $('.chat-item[data-pub="' + pub +'"]');
  chatListEl.find('.unseen').empty().hide();
  $("#message-view").toggleClass('public-messages-view', pub === 'public');
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
  $(".message-form form").off().on('submit', e => onMsgFormSubmit(e, pub));
  Notifications.changeChatUnseenCount(pub, 0);
  Profile.addUserToHeader(pub);
  $('#message-view').scroll(_.throttle(() => {
    if ($('#attachment-preview:visible').length) { return; }
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
  }, 200));
  lastSeenTimeChanged(pub);
  chats[pub].setMyMsgsLastSeenTime();
  Helpers.scrollToMessageListBottom();
  chats[pub].setMyMsgsLastSeenTime();
  Profile.setTheirOnlineStatus(pub);
  setDeliveredCheckmarks(pub);
}

async function onMsgFormSubmit(event, pub) {
  event.preventDefault();
  chats[pub].msgDraft = null;
  var text = $('#new-msg').val();
  if (!text.length && !chats[pub].attachments) { return; }
  chats[pub].setTyping(false);
  var msg = {text};
  if (chats[pub].attachments) {
    msg.attachments = chats[pub].attachments;
  }
  const myKey = Session.getKey();
  const shouldWebPush = (pub === myKey.pub) || !(chats[pub].online && chats[pub].online.isOnline);
  if (shouldWebPush && chats[pub].webPushSubscriptions) {
    const subscriptions = [];
    const participants = Object.keys(chats[pub].webPushSubscriptions);
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const secret = await chats[pub].getSecret(participant);
      const myName = Session.getMyName();
      const titleText = chats[pub].uuid ? chats[pub].name : myName;
      const bodyText = chats[pub].uuid ? `${myName}: ${text}` : text;
      const payload = {
        title: await Gun.SEA.encrypt(titleText, secret),
        body: await Gun.SEA.encrypt(bodyText, secret),
        from:{pub: myKey.pub, epub: myKey.epub}
      };
      chats[pub].webPushSubscriptions[participant].forEach(s => subscriptions.push({subscription: s, payload}));
    }
    fetch(notificationServiceUrl, {
      method: 'POST',
      body: JSON.stringify({subscriptions}),
      headers: {
        'content-type': 'application/json'
      }
    });
  }
  chats[pub].send(msg);
  Gallery.closeAttachmentsPreview();
  $('#new-msg').val('');
}

function deleteChat(pub) {
  iris.Channel.deleteChannel(publicState, Session.getKey(), pub);
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
  const channel = new iris.Channel({gun: publicState, key: Session.getKey(), chatLink: chatLink, participants: pub});
  addChat(channel);
}

function addChat(channel) {
  console.log('addChat', channel);
  var pub = channel.getId();
  if (chats[pub]) { return; }
  chats[pub] = channel;
  const chatNode = localState.get('chats').get(pub);
  $('#welcome').remove();
  var el = $('<div class="chat-item"><div class="text"><div><span class="name"></span><small class="latest-time"></small></div> <small class="typing-indicator"></small> <small class="latest"></small> <span class="unseen"></span></div></div>');
  el.attr('data-pub', pub);
  var latestEl = el.find('.latest');
  var typingIndicator = el.find('.typing-indicator').text(t('typing'));
  chats[pub].getLatestMsg && chats[pub].getLatestMsg(latest => {
    if (latest.time && latest.text) {
      localState.get('chats').get(pub).get('latestTime').put(latest.time);
      localState.get('chats').get(pub).get('latestText').put(latest.text);
    }
  });
  Notifications.changeChatUnseenCount(pub, 0);
  chats[pub].messageIds = chats[pub].messageIds || {};
  chats[pub].sortedMessages = chats[pub].sortedMessages || [];
  chats[pub].identicon = Helpers.getIdenticon(pub, 49);
  chats[pub].onTheir('nickname', (nick) => {
    chats[pub].myNickname = nick;
    $('#profile-nickname-my').text(nick && nick.length ? nick : '');
    $('#profile-nickname-my-container').toggle(!!(nick && nick.length));
  });
  chats[pub].onMy('nickname', (nick) => {
    chats[pub].theirNickname = nick;
    if (pub !== Session.getKey().pub) {
      el.find('.name').text(Helpers.truncateString(Profile.getDisplayName(pub), 20));
    }
    if (pub === activeChat || pub === activeProfile) {
      Profile.addUserToHeader(pub);
    }
  });
  chats[pub].notificationSetting = 'all';
  chats[pub].onMy('notificationSetting', (val) => {
    chats[pub].notificationSetting = val;
    if (pub === activeProfile) {
      $("input[name=notificationPreference][value=" + val + "]").attr('checked', 'checked');
    }
  });
  //$(".chat-list").append(el);
  chats[pub].getTheirMsgsLastSeenTime(time => {
    if (chats[pub]) {
      chats[pub].theirLastSeenTime = new Date(time);
      lastSeenTimeChanged(pub);
    }
  });
  chats[pub].getMyMsgsLastSeenTime(time => {
    chats[pub].myLastSeenTime = new Date(time);
    if (chats[pub].latest && chats[pub].myLastSeenTime >= chats[pub].latest.time) {
      Notifications.changeChatUnseenCount(pub, 0);
    }
    PeerManager.askForPeers(pub); // TODO: this should be done only if we have a chat history or friendship with them
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
  iris.Channel.getOnline(publicState, pub, (online) => {
    if (chats[pub]) {
      chats[pub].online = online;
      Profile.setTheirOnlineStatus(pub);
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
      chatNode.get('name').put(name);
    }
    if (pub === Session.getKey().pub) {
      el.find('.name').html("📝 <b>" + t('note_to_self') + "</b>");
    } else {
      el.find('.name').text(Helpers.truncateString(Profile.getDisplayName(pub), 20));
    }
    if (pub === activeChat || pub === activeProfile) {
      Profile.addUserToHeader(pub);
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
  function setGroupPhoto(photo, from) {
    var profile = chats[pub].participantProfiles[from];
    if (profile && !(profile.permissions && profile.permissions.admin)) {
      return;
    }
    chats[pub].photo = photo;
    el.find('.identicon-container').empty();
    var img = Helpers.setImgSrc($('<img>'), photo).attr('height', 49).attr('width', 49).css({'border-radius': '50%'});
    el.find('.identicon-container').append(photo ? img : chats[pub].identicon);
    if (pub === activeChat || pub === activeProfile) {
      Profile.addUserToHeader(pub);
    }
    if (pub === activeProfile) {
      Helpers.setImgSrc($('#current-profile-photo'), photo);
      Helpers.setImgSrc($('#profile .profile-photo'), photo);
    }
    $('#current-profile-photo').toggle(!!photo);
  }
  if (chats[pub].uuid) {
    chats[pub].on('name', setName);
    chats[pub].on('about', setAbout);
    chats[pub].on('photo', setGroupPhoto);
    chats[pub].participantProfiles = {};
    chats[pub].onMy('participants', participants => {
      if (typeof participants === 'object') {
        var keys = Object.keys(participants);
        keys.forEach((k, i) => {
          if (chats[pub].participantProfiles[k]) { return; }
          var hue = 360 / Math.max(keys.length, 2) * i; // TODO use css filter brightness
          chats[pub].participantProfiles[k] = {permissions: participants[k], color: `hsl(${hue}, 98%, ${isDarkMode ? 80 : 33}%)`};
          publicState.user(k).get('profile').get('name').on(name => {
            chats[pub].participantProfiles[k].name = name;
          });
        });
      }
      if (activeProfile === pub) {
        Profile.renderGroupParticipants(pub);
        Profile.renderGroupPhotoSettings(pub);
        Profile.renderInviteLinks(pub);
      }
      if (activeChat === pub) {
        Profile.addUserToHeader(pub);
      }
    });
    var isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    chats[pub].inviteLinks = {};
    chats[pub].getChatLinks({callback: ({url, id}) => {
      console.log('received chat link', id, url);
      chats[pub].inviteLinks[id] = url;
      if (pub === activeProfile) {
        Profile.renderInviteLinks(pub);
      }
    }});
  } else {
    publicState.user(pub).get('profile').get('name').on(setName);
    publicState.user(pub).get('profile').get('about').on(setAbout);
  }
  if (chats[pub].put) {
    chats[pub].onTheir('webPushSubscriptions', (s, k, from) => {
      if (!Array.isArray(s)) { return; }
      chats[pub].webPushSubscriptions = chats[pub].webPushSubscriptions || {};
      chats[pub].webPushSubscriptions[from || pub] = s;
    });
    const arr = Object.values(Notifications.webPushSubscriptions);
    setTimeout(() => chats[pub].put('webPushSubscriptions', arr), 5000);
  }
  chats[pub].onTheir('call', call => VideoCall.onCallMessage(pub, call));
  localState.get('chats').get(pub).put({enabled:true});
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
    setLatestCheckmark(pub);
  }
}

function showNewChat() {
  resetView();
  $('.chat-item.new').toggleClass('active', true);
  $('#new-chat').show();
  $("#header-content").text(t('new_chat'));
  $('#show-my-qr-btn').off().click(() => {
    $('#my-qr-code').toggle()
  })
}

function lastSeenTimeChanged(pub) {
  console.log('lastSeenTimeChanged', pub, chats[pub].theirLastSeenTime);
  setLatestSeen(pub);
  setDeliveredCheckmarks(pub);
  if (pub !== 'public' && pub === activeChat) {
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

function createGroupSubmit(e) {
  e.preventDefault();
  if ($('#new-group-name').val().length) {
    var c = new iris.Channel({
      gun: publicState,
      key: Session.getKey(),
      participants: [],
    });
    c.put('name', $('#new-group-name').val());
    $('#new-group-name').val('');
    addChat(c);
    Profile.showProfile(c.uuid);
  }
}

function onPasteChatLink(event) {
  var val = $(event.target).val();
  if (val.length < 30) {
    return;
  }
  var s = val.split('?');
  if (s.length !== 2) { return; }
  var chatId = Helpers.getUrlParameter('chatWith', s[1]) || Helpers.getUrlParameter('channelId', s[1]);
  if (chatId) {
    newChat(chatId, val);
    showChat(chatId);
  }
  $(event.target).val('');
}

function onWindowResize() { // if resizing up from mobile size menu view
  if ($(window).width() > 565 && $('.main-view:visible').length === 0) {
    showNewChat();
  }
}

function scanChatLinkQr() {
  if ($('#chatlink-qr-video:visible').length) {
    $('#chatlink-qr-video').hide();
    QRScanner.cleanupScanner();
  } else {
    $('#chatlink-qr-video').show();
    QRScanner.startChatLinkQRScanner();
  }
}

function init() {
  $(window).resize(onWindowResize);
  $('.chat-item.new').click(showNewChat);
  $('#paste-chat-link').on('input', onPasteChatLink);
  $('#new-group-form').submit(createGroupSubmit);
  $('#scan-chatlink-qr-btn').click(scanChatLinkQr);
}

export { init, showChat, activeChat, chats, addChat, deleteChat, showNewChat, newChat, lastSeenTimeChanged, setLatestSeen, setLatestCheckmark};
