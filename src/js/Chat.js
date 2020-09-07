import {publicState, localState, showMenu, resetView, activeRoute, activeProfile} from './Main.js';
import { translate as t } from './Translation.js';
import Helpers from './Helpers.js';
import Notifications from './Notifications.js';
import PeerManager from './PeerManager.js';
import Session from './Session.js';
import Profile from './components/Profile.js';
import VideoCall from './VideoCall.js';

const chats = window.chats = {};

function showChat(pub) {
  if (!pub) {
    return;
  }

  resetView();
  localState.get('activeRoute').put(`chat/${pub}`);
  if (!Object.prototype.hasOwnProperty.call(chats, pub)) {
    newChat(pub);
  }
  $("#message-view").show();
  if (!iris.util.isMobile) {
    $("#new-msg").focus();
  }
  Notifications.changeChatUnseenCount(pub, 0);
  chats[pub].setMyMsgsLastSeenTime();
  Helpers.scrollToMessageListBottom();
  chats[pub].setMyMsgsLastSeenTime();
}

function deleteChat(pub) {
  iris.Channel.deleteChannel(publicState, Session.getKey(), pub);
  if (activeRoute === pub) {
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
  var pub = channel.getId();
  if (chats[pub]) { return; }
  chats[pub] = channel;
  const chatNode = localState.get('chats').get(pub);
  chatNode.get('latestTime').on(t => {
    if (t && (!chats[pub].latestTime || t > chats[pub].latestTime)) {
      chats[pub].latestTime = t;
    } else {
      chatNode.get('latestTime').put(chats[pub].latestTime);
    }
  });
  chatNode.get('theirMsgsLastSeenTime').on(t => {
    if (!t) { return; }
    const d = new Date(t);
    if (!chats[pub].theirMsgsLastSeenDate || chats[pub].theirMsgsLastSeenDate < d) {
      chats[pub].theirMsgsLastSeenDate = d;
    }
  });
  $('#welcome').remove();
  var el = $('<div class="chat-item"><div class="text"><div><span class="name"></span><small class="latest-time"></small></div> <small class="typing-indicator"></small> <small class="latest"></small> <span class="unseen"></span></div></div>');
  el.attr('data-pub', pub);
  chats[pub].getLatestMsg && chats[pub].getLatestMsg((latest, info) => {
    processMessage(pub, latest, info);
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
  });
  chats[pub].notificationSetting = 'all';
  chats[pub].onMy('notificationSetting', (val) => {
    chats[pub].notificationSetting = val;
    if (pub === activeProfile) {
      $("input[name=notificationPreference][value=" + val + "]").attr('checked', 'checked');
    }
  });
  //$(".chat-list").append(el);
  chats[pub].theirMsgsLastSeenTime = '';
  chats[pub].getTheirMsgsLastSeenTime(time => {
    if (chats[pub] && time && time > chats[pub].theirMsgsLastSeenTime) {
      chats[pub].theirMsgsLastSeenTime = time;
      chatNode.get('theirMsgsLastSeenTime').put(time);
    }
  });
  chats[pub].getMyMsgsLastSeenTime(time => {
    chats[pub].myLastSeenTime = new Date(time);
    if (chats[pub].latest && chats[pub].myLastSeenTime >= chats[pub].latest.time) {
      Notifications.changeChatUnseenCount(pub, 0);
    }
    PeerManager.askForPeers(pub); // TODO: this should be done only if we have a chat history or friendship with them
  });
  chats[pub].isTyping = false;
  chats[pub].getTyping(isTyping => {
    chats[pub].isTyping = isTyping;
    localState.get('chats').get(pub).get('isTyping').put(isTyping);
  });
  chats[pub].online = {};
  iris.Channel.getOnline(publicState, pub, (online) => {
    if (chats[pub]) {
      chatNode.put({theirLastActiveTime: online && online.lastActive, isOnline: online && online.isOnline});
      chats[pub].online = online;
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
    if (photo && photo.indexOf('data:image') !== 0) { return; }
    localState.get('chats').get(pub).get('photo').put(photo);
    chats[pub].photo = photo;
    el.find('.identicon-container').empty();
    var img = Helpers.setImgSrc($('<img>'), photo).attr('height', 49).attr('width', 49).css({'border-radius': '50%'});
    el.find('.identicon-container').append(photo ? img : chats[pub].identicon);
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

function processMessage(chatId, msg, info) {
  const chat = chats[chatId];
  if (chat.messageIds[msg.time + info.from]) return;
  chat.messageIds[msg.time + info.from] = true;
  msg.info = info;
  msg.selfAuthored = info.selfAuthored;
  msg.timeStr = msg.time;
  msg.time = new Date(msg.time);
  chat.sortedMessages.push(msg);
  if (!info.selfAuthored && msg.time > (chat.myLastSeenTime || -Infinity)) {
    if (activeRoute !== chatId || document.visibilityState !== 'visible') {
      Notifications.changeChatUnseenCount(chatId, 1);
    }
  }
  if (!info.selfAuthored && msg.timeStr > chat.theirMsgsLastSeenTime) {
    localState.get('chats').get(chatId).get('theirMsgsLastSeenTime').put(msg.timeStr);
  }
  if (!chat.latestTime || (msg.timeStr > chat.latestTime)) {
    localState.get('chats').get(chatId).put({
      latestTime: msg.timeStr,
      latest: {time: msg.timeStr, text: msg.text, selfAuthored: info.selfAuthored}
    });
  }
  Notifications.notifyMsg(msg, info, chatId);
}

function showNewChat() {
  resetView();
  $('#new-chat').show();
  $('#show-my-qr-btn').off().click(() => {
    $('#my-qr-code').toggle()
  })
}

export { showChat, activeRoute, chats, addChat, deleteChat, showNewChat, newChat, processMessage };
