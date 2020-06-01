import { html, render, useEffect, useState } from './lib/htm.preact.js';
import {gun, showMenu, resetView, activeChat, setActiveChat, activeProfile} from './Main.js';
import { translate as t } from './Translation.js';
import Helpers from './Helpers.js';
import Notifications from './Notifications.js';
import PeerManager from './PeerManager.js';
import Session from './Session.js';
import Gallery from './Gallery.js';
import Profile from './Profile.js';
import QRScanner from './QRScanner.js';
import VideoCall from './VideoCall.js';

var chats = window.chats = {};
var autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});

const Chat = () => html`
  <div class="main-view" id="message-view">
    <div id="message-list"></div>
    <div id="attachment-preview" class="hidden"></div>
  </div>
  <div id="not-seen-by-them" style="display: none">
    <p dangerouslySetInnerHTML=${{ __html: t('if_other_person_doesnt_see_message') }}></p>
    <p><button class="copy-chat-link">${t('copy_your_chat_link')}</button></p>
  </div>
  <div class="message-form" style="display:none">
    <form autocomplete="off">
      <input name="attachment-input" type="file" class="hidden" id="attachment-input" accept="image/*" multiple/>
      <button type="button" id="attach-file">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21.586 10.461l-10.05 10.075c-1.95 1.949-5.122 1.949-7.071 0s-1.95-5.122 0-7.072l10.628-10.585c1.17-1.17 3.073-1.17 4.243 0 1.169 1.17 1.17 3.072 0 4.242l-8.507 8.464c-.39.39-1.024.39-1.414 0s-.39-1.024 0-1.414l7.093-7.05-1.415-1.414-7.093 7.049c-1.172 1.172-1.171 3.073 0 4.244s3.071 1.171 4.242 0l8.507-8.464c.977-.977 1.464-2.256 1.464-3.536 0-2.769-2.246-4.999-5-4.999-1.28 0-2.559.488-3.536 1.465l-10.627 10.583c-1.366 1.368-2.05 3.159-2.05 4.951 0 3.863 3.13 7 7 7 1.792 0 3.583-.684 4.95-2.05l10.05-10.075-1.414-1.414z"/></svg>
      </button>
      <button type="button" id="emoji-picker">
        <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="smile" class="svg-inline--fa fa-smile fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1-10.2 8.5-11.5 23.6-3.1 33.8 30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8-10.1-8.4-25.3-7.1-33.8 3.1z"></path></svg>
      </button>
      <input id="new-msg" type="text" placeholder="${t('type_a_message')}" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="off"/>
      <button type="submit">
        <svg class="svg-inline--fa fa-w-16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 486.736 486.736" style="enable-background:new 0 0 486.736 486.736;" xml:space="preserve" width="100px" height="100px" fill="#000000" stroke="#000000" stroke-width="0"><path fill="currentColor" d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"></path></svg>
      </button>
    </form>
  </div>`;

const NewChat = () => html`<div class="main-view" id="new-chat">
  <h3>${t('have_someones_chat_link')}</h3>
  <input id="paste-chat-link" type="text" placeholder="${t('paste_their_chat_link')}"/>
  <button id="scan-chatlink-qr-btn">${t('or_scan_qr_code')}</button>
  <video id="chatlink-qr-video" width="320" height="320" style="object-fit: cover;"></video>
  <h3>${t('give_your_chat_link')}</h3>
  <button class="copy-chat-link">${t('copy_your_chat_link')}</button>
  <button id="show-my-qr-btn">${t('or_show_qr_code')}</button>
  <p id="my-qr-code" class="qr-container" style="display:none"></p>
  <p><small dangerouslySetInnerHTML=${{ __html: t('beware_of_sharing_chat_link_publicly') }}></span></p>
  <h3>${t('new_group')}</h3>
  <p>
    <input id="new-group-name" type="text" placeholder="${t('group_name')}"/>
    <button id="new-group-create">${t('create')}</button>
  </p>
  <hr/>
  <h3>${t('your_chat_links')}</h3>
  <p><button id="generate-chat-link">${t('create_new_chat_link')}</button></p>
  <div id="my-chat-links" class="flex-table"></div>
</div>`;

function showChat(pub) {
  if (!pub) {
    return;
  }
  resetView();
  setActiveChat(pub);
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
    Gallery.closeAttachmentsPreview();
    $('#new-msg').val('');
  });
  Notifications.changeChatUnseenCount(pub, 0);
  Profile.addUserToHeader(pub);
  var msgs = Object.values(chats[pub].messages);
  msgs.forEach(msg => addMessage(msg, pub));
  sortMessagesByTime();
  $('#message-view').scroll(() => {
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
  });
  lastSeenTimeChanged(pub);
  chats[pub].setMyMsgsLastSeenTime();
  Helpers.scrollToMessageListBottom();
  chats[pub].setMyMsgsLastSeenTime();
  Profile.setTheirOnlineStatus(pub);
  setDeliveredCheckmarks(pub);
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
      $(this).before($('<div>').text(t(separatorText)).addClass('day-separator'));
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

const SeenIndicator = () => html`<span class="seen-indicator"><svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg></span>`;

const Message = (props) => {
  const [innerText, setInnerText] = useState('');
  let name;
  if (chats[props.chatId].uuid && !props.info.selfAuthored) {
    const profile = chats[props.chatId].participantProfiles[props.info.from];
    name = profile && profile.name;
    /*if (name) {
      var nameEl = $('<small>').click(() => addMention(name)).text(name).css({color: profile.color}).addClass('msgSenderName');
      msgContent.prepend(nameEl);
    }*/
  }
  const emojiOnly = props.text.length === 2 && Helpers.isEmoji(props.text);
  const text = emojiOnly ? props.text : Helpers.highlightEmoji(props.text); // escape
  useEffect(() => {
    // This code will only execute once per message
    // We use useEffect because we're acting outside of Preact
    // and working with the DOM
    // We clean up the text, making sure to prevent XSS attacks,
    // this is key since we're implicitly using innerHTML later 
    // on, when we call dangerouslySetInnerHTML
    const p = document.createElement('p');
    p.innerText = text;
    // We set innerText to the result of autolinker
    setInnerText(autolinker.link(p.innerHTML));
  }, []);

  // If innerText is empty, we (implicitly) return null
  // This guarantees we only show the message once it's ready
  return innerText && html`
    <div class="msg ${props.selfAuthored ? 'our' : 'their'}">
      <div class="msg-content">
        ${name && html`<small onclick=${() => addMention(name)}>${name}</small>`}
        ${props.attachments && props.attachments.map(a =>
          html`<img src=${a.data} onclick=${e => { Gallery.openAttachmentsGallery(props, e); }}/>` // escape a.data
        )}
        <div class="text ${emojiOnly && 'emoji-only'}" dangerouslySetInnerHTML=${{ __html: innerText }}>
        </div>
        <div class="time">
          ${iris.util.formatTime(props.time)}
          ${props.selfAuthored && SeenIndicator()}
        </div>
      </div>
    </div>`;
};

function addMessage(msg, chatId) {
  const container = $('<div>');
  $("#message-list").append(container); // TODO: render the whole message array somewhere else
  render(html`<${Message} ...${msg} chatId=${chatId}/>`, container[0]);
  container.find('img').one('load', Helpers.scrollToMessageListBottom);
}

function deleteChat(pub) {
  iris.Channel.deleteChannel(gun, Session.getKey(), pub);
  if (activeChat === pub) {
    showNewChat();
    showMenu();
  }
  delete chats[pub];
  $('.chat-item[data-pub="' + pub +'"]').remove();
}

function addMention(name) {
  $('#new-msg').val($('#new-msg').val().trim() + ` @${name} `);
  $('#new-msg').focus();
}

function newChat(pub, chatLink) {
  if (!pub || Object.prototype.hasOwnProperty.call(chats, pub)) {
    return;
  }
  const channel = new iris.Channel({gun, key: Session.getKey(), chatLink: chatLink, participants: pub});
  addChat(channel);
}

function addChat(channel) {
  var pub = channel.getId();
  if (chats[pub]) { return; }
  chats[pub] = channel;
  $('#welcome').remove();
  var el = $('<div class="chat-item"><div class="text"><div><span class="name"></span><small class="latest-time"></small></div> <small class="typing-indicator"></small> <small class="latest"></small> <span class="unseen"></span></div></div>');
  el.attr('data-pub', pub);
  var latestEl = el.find('.latest');
  var typingIndicator = el.find('.typing-indicator').text(t('typing'));
  chats[pub].getMessages((msg, info) => {
    chats[pub].messages[msg.time] = msg;
    msg.info = info;
    msg.selfAuthored = info.selfAuthored;
    msg.time = new Date(msg.time);
    if (!info.selfAuthored && msg.time > (chats[pub].myLastSeenTime || -Infinity)) {
      if (activeChat !== pub || document.visibilityState !== 'visible') {
        Notifications.changeChatUnseenCount(pub, 1);
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
        text = '['+ t('attachment') +']' + (text.length ? ': ' + text : '');
      } else {
        text = msg.text;
      }
      if (chats[pub].uuid && !msg.selfAuthored && msg.info.from && chats[pub].participantProfiles[msg.info.from].name) {
        text = chats[pub].participantProfiles[msg.info.from].name + ': ' + text;
      }
      var latestTimeText = iris.util.getDaySeparatorText(msg.time, msg.time.toLocaleDateString({dateStyle:'short'}));
      latestTimeText = t(latestTimeText);
      if (latestTimeText === t('today')) { latestTimeText = iris.util.formatTime(msg.time); }
      latestEl.text(text);
      latestEl.html(Helpers.highlightEmoji(latestEl.html()));
      if (info.selfAuthored) {
        //latestEl.prepend($(seenIndicatorHtml));
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
      if (chats[pub].latest.time === msg.time && Session.areWeOnline) {
        chats[pub].setMyMsgsLastSeenTime();
      }
      if (chats[pub].theirLastSeenTime) {
        $('#not-seen-by-them').slideUp();
      } else if (!chats[pub].uuid) {
        $('#not-seen-by-them').slideDown();
      }
      Helpers.scrollToMessageListBottom();
    }
    Notifications.notifyMsg(msg, info, pub);
  });
  Notifications.changeChatUnseenCount(pub, 0);
  chats[pub].messages = chats[pub].messages || [];
  chats[pub].identicon = Helpers.getIdenticon(pub, 49);
  el.prepend($('<div>').addClass('identicon-container').append(chats[pub].identicon));
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
  iris.Channel.getOnline(gun, pub, (online) => {
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
    }
    if (pub === Session.getKey().pub) {
      el.find('.name').html("📝<b>" + t('note_to_self') + "</b>");
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
          gun.user(k).get('profile').get('name').on(name => {
            chats[pub].participantProfiles[k].name = name;
          });
        });
      }
      if (activeProfile === pub) {
        Profile.renderGroupParticipants(pub);
      }
      if (activeChat === pub) {
        Profile.addUserToHeader(pub);
      }
    });
    var isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    gun.user(pub).get('profile').get('name').on(setName);
    gun.user(pub).get('profile').get('about').on(setAbout);
  }
  chats[pub].onTheir('call', call => VideoCall.onCallMessage(pub, call));
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

function createGroupClicked(e) {
  e.preventDefault();
  if ($('#new-group-name').val().length) {
    var c = new iris.Channel({
      gun,
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
  $('#new-group-create').click(createGroupClicked);
  $('#scan-chatlink-qr-btn').click(scanChatLinkQr);
}

export {NewChat, init, showChat, activeChat, chats, addChat, deleteChat, showNewChat, newChat};
export default Chat;
