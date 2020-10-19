import {publicState, localState, activeRoute, activeProfile} from './Main.js';
import { translate as t } from './Translation.js';
import Helpers from './Helpers.js';
import Notifications from './Notifications.js';
import PeerManager from './PeerManager.js';
import Session from './Session.js';
import { route } from './lib/preact-router.es.js';

const chats = window.chats = {};

function deleteChat(pub) {
  iris.Channel.deleteChannel(publicState, Session.getKey(), pub);
  delete chats[pub];
  $('.chat-item[data-pub="' + pub +'"]').remove();
}

function newChat(pub, chatLink) {
  if (!pub || Object.prototype.hasOwnProperty.call(chats, pub)) {
    return;
  }
  const chat = new iris.Channel({gun: publicState, key: Session.getKey(), chatLink: chatLink, participants: pub});
  addChat(chat);
}

function followChatLink(str) {
  if (str && str.indexOf('http') === 0) {
    if (str.indexOf('https://iris.to/#/') === 0) {
      route(str.replace('https://iris.to/#', ''));
      return true;
    } else if (str.length > 30) {
      const s = str.split('?');
      let chatId;
      if (s.length === 2) {
        chatId = Helpers.getUrlParameter('chatWith', s[1]) || Helpers.getUrlParameter('channelId', s[1]);
      }
      if (chatId) {
        newChat(chatId, str);
        route('/chat/' + chatId);
        return true;
      }
    }
  }
}

function addChat(chat) {
  var pub = chat.getId();
  if (chats[pub]) { return; }
  chats[pub] = chat;
  const chatNode = localState.get('chats').get(pub);
  chatNode.get('latestTime').on(t => {
    if (t && (!chat.latestTime || t > chat.latestTime)) {
      chat.latestTime = t;
    } else {
      chatNode.get('latestTime').put(chat.latestTime);
    }
  });
  chatNode.get('theirMsgsLastSeenTime').on(t => {
    if (!t) { return; }
    const d = new Date(t);
    if (!chat.theirMsgsLastSeenDate || chat.theirMsgsLastSeenDate < d) {
      chat.theirMsgsLastSeenDate = d;
    }
  });
  var el = $('<div class="chat-item"><div class="text"><div><span class="name"></span><small class="latest-time"></small></div> <small class="typing-indicator"></small> <small class="latest"></small> <span class="unseen"></span></div></div>');
  el.attr('data-pub', pub);
  chat.messageIds = chat.messageIds || {};
  chat.getLatestMsg && chat.getLatestMsg((latest, info) => {
    processMessage(pub, latest, info);
  });
  Notifications.changeChatUnseenCount(pub, 0);
  chat.sortedMessages = chat.sortedMessages || [];
  chat.identicon = Helpers.getIdenticon(pub, 49);
  chat.onTheir('nickname', (nick) => {
    chat.myNickname = nick;
    localState.get('chats').get(pub).get('myNickname').put(nick);
  });
  chat.onMy('nickname', (nick) => {
    chat.theirNickname = nick;
    if (pub !== Session.getKey().pub) {
      localState.get('chats').get(pub).get('theirNickname').put(nick);
    }
  });
  chat.notificationSetting = 'all';
  chat.onMy('notificationSetting', (val) => {
    chat.notificationSetting = val;
    if (pub === activeProfile) {
      $("input[name=notificationPreference][value=" + val + "]").attr('checked', 'checked');
    }
  });
  //$(".chat-list").append(el);
  chat.theirMsgsLastSeenTime = '';
  chat.getTheirMsgsLastSeenTime(time => {
    if (chat && time && time > chat.theirMsgsLastSeenTime) {
      chat.theirMsgsLastSeenTime = time;
      chatNode.get('theirMsgsLastSeenTime').put(time);
    }
  });
  chat.getMyMsgsLastSeenTime(time => {
    chat.myLastSeenTime = new Date(time);
    if (chat.latest && chat.myLastSeenTime >= chat.latest.time) {
      Notifications.changeChatUnseenCount(pub, 0);
    }
    PeerManager.askForPeers(pub); // TODO: this should be done only if we have a chat history or friendship with them
  });
  chat.isTyping = false;
  chat.getTyping(isTyping => {
    chat.isTyping = isTyping;
    localState.get('chats').get(pub).get('isTyping').put(isTyping);
  });
  chat.online = {};
  iris.Channel.getActivity(publicState, pub, (activity) => {
    if (chat) {
      chatNode.put({theirLastActiveTime: activity && activity.lastActive, activity: activity && activity.isActive && activity.status});
      chat.activity = activity;
    }
  });
  function setName(name, from) {
    if (chat.uuid) {
      var profile = chat.participantProfiles[from];
      if (profile && !(profile.permissions && profile.permissions.admin)) {
        return;
      }
    }
    if (name && typeof name === 'string') {
      chat.name = name;
      chatNode.get('name').put(name);
    }
    if (pub === Session.getKey().pub) {
      el.find('.name').html("📝 <b>" + t('note_to_self') + "</b>");
    } else {
      el.find('.name').text(Helpers.truncateString(getDisplayName(pub), 20));
    }
    if (pub === activeProfile) {
      $('#profile-group-name').not(':focus').val(name);
    }
  }
  function setAbout(about) {
    chat.about = about;
  }
  function setGroupPhoto(photo, from) {
    var profile = chat.participantProfiles[from];
    if (profile && !(profile.permissions && profile.permissions.admin)) {
      return;
    }
    if (photo && photo.indexOf('data:image') !== 0) { return; }
    localState.get('chats').get(pub).get('photo').put(photo);
    chat.photo = photo;
    el.find('.identicon-container').empty();
    var img = Helpers.setImgSrc($('<img>'), photo).attr('height', 49).attr('width', 49).css({'border-radius': '50%'});
    el.find('.identicon-container').append(photo ? img : chat.identicon);
    if (pub === activeProfile) {
      Helpers.setImgSrc($('#current-profile-photo'), photo);
      Helpers.setImgSrc($('#profile .profile-photo'), photo);
    }
    $('#current-profile-photo').toggle(!!photo);
  }
  if (chat.uuid) {
    chat.on('name', setName);
    chat.on('about', setAbout);
    chat.on('photo', setGroupPhoto);
    chat.participantProfiles = {};
    chat.onMy('participants', participants => {
      if (typeof participants === 'object') {
        var keys = Object.keys(participants);
        keys.forEach((k, i) => {
          if (chat.participantProfiles[k]) { return; }
          var hue = 360 / Math.max(keys.length, 2) * i; // TODO use css filter brightness
          chat.participantProfiles[k] = {permissions: participants[k], color: `hsl(${hue}, 98%, ${isDarkMode ? 80 : 33}%)`};
          publicState.user(k).get('profile').get('name').on(name => {
            chat.participantProfiles[k].name = name;
          });
        });
      }
      localState.get('chats').get(chat.uuid).get('participants').put(participants);
    });
    var isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    chat.inviteLinks = {};
    chat.getChatLinks({callback: ({url, id}) => {
      chat.inviteLinks[id] = url;
      if (pub === activeProfile) {
        localState.get('inviteLinksChanged').put(true);
      }
    }});
  } else {
    publicState.user(pub).get('profile').get('name').on(setName);
  }
  if (chat.put) {
    chat.onTheir('webPushSubscriptions', (s, k, from) => {
      if (!Array.isArray(s)) { return; }
      chat.webPushSubscriptions = chat.webPushSubscriptions || {};
      chat.webPushSubscriptions[from || pub] = s;
    });
    const arr = Object.values(Notifications.webPushSubscriptions);
    setTimeout(() => chat.put('webPushSubscriptions', arr), 5000);
  }
  chat.onTheir('call', call => {
    localState.get('call').put({pub, call});
  });
  localState.get('chats').get(pub).put({enabled:true});
}

function getDisplayName(pub) {
  var displayName;
  const chat = chats[pub];
  if (chat && chat.theirNickname && chat.theirNickname.length) {
    displayName = chat.theirNickname;
    if (chat.name && chat.name.length) {
      displayName = displayName + ' (' + chat.name + ')';
    }
  } else {
    displayName = chat ? chat.name : '';
  }
  return displayName || '';
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
    if (activeRoute !== '/chat/' + chatId || document.visibilityState !== 'visible') {
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

export { chats, addChat, deleteChat, newChat, processMessage, getDisplayName, followChatLink };
