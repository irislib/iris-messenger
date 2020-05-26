import {resetView, activeChat, activeProfile, setActiveProfile} from './Main.js';
import {chats} from '../services/Chats.js';
import Session from '../services/Session.js';
import Helpers from '../Helpers.js';

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
    var identicon = Helpers.getIdenticon(k, 40).css({'margin-right':15});
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
    el.click(() => Profile.showProfile(k));
    $('#profile-group-participants').append(el);
  });
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

function addUserToHeader(pub) {
  $('#header-content').empty();
  var nameEl = $('<div class="name"></div>');
  if (pub === (Session.key && Session.key.pub) && activeProfile !== pub) {
    nameEl.html("📝<b>Note to Self</b>");
  } else if (chats[pub]) {
    nameEl.text(getDisplayName(pub));
  }
  nameEl.show();

  var identicon = Helpers.getIdenticon(pub, 40);
  var img = identicon.children('img').first();
  img.attr('height', 40).attr('width', 40);
  $("#header-content").append($('<div>').addClass('identicon-container').append(identicon));
  var textEl = $('<div>').addClass('text');
  textEl.append(nameEl);
  if (chats[pub] && chats[pub].uuid) {
    var t = Object.keys(chats[pub].participantProfiles).map(p => chats[pub].participantProfiles[p].name).join(', ');
    var namesEl = $('<small>').addClass('participants').text(t);
    textEl.append(namesEl);
    if (chats[pub].photo) {
      identicon.hide();
      var photo = Helpers.setImgSrc($('<img>'), chats[pub].photo).attr('height', 40).attr('width', 40).css({'border-radius': '50%'});
      $('#header-content .identicon-container').append(photo);
    }
  }
  textEl.append($('<small>').addClass('last-seen'));
  textEl.append($('<small>').addClass('typing-indicator').text('typing...'));
  $("#header-content").append(textEl);
  textEl.on('click', () => showProfile(pub));
  var videoCallBtn = $(`<a class="tooltip"><span class="tooltiptext">Video call</span><svg enable-background="new 0 0 50 50" id="Layer_1" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="none" style="height:24px;width:24px"/><polygon fill="none" points="49,14 36,21 36,29   49,36 " stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/><path d="M36,36c0,2.209-1.791,4-4,4  H5c-2.209,0-4-1.791-4-4V14c0-2.209,1.791-4,4-4h27c2.209,0,4,1.791,4,4V36z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/></svg></a>`).attr('id', 'start-video-call').css({width:24, height:24, color: 'var(--msg-form-button-color)'});
  videoCallBtn.click(() => VideoCall.callingInterval ? null : VideoCall.callUser(pub));
  var voiceCallBtn = $('<a><svg enable-background="new 0 0 50 50" style="height:20px;width:20px" id="Layer_1" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="none" height="50" width="50"/><path d="M30.217,35.252c0,0,4.049-2.318,5.109-2.875  c1.057-0.559,2.152-0.7,2.817-0.294c1.007,0.616,9.463,6.241,10.175,6.739c0.712,0.499,1.055,1.924,0.076,3.32  c-0.975,1.396-5.473,6.916-7.379,6.857c-1.909-0.062-9.846-0.236-24.813-15.207C1.238,18.826,1.061,10.887,1,8.978  C0.939,7.07,6.459,2.571,7.855,1.595c1.398-0.975,2.825-0.608,3.321,0.078c0.564,0.781,6.124,9.21,6.736,10.176  c0.419,0.66,0.265,1.761-0.294,2.819c-0.556,1.06-2.874,5.109-2.874,5.109s1.634,2.787,7.16,8.312  C27.431,33.615,30.217,35.252,30.217,35.252z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="4"/></svg></a>').css({width:20, height:20, 'margin-right': 20});
  voiceCallBtn.click(() => VideoCall.callingInterval ? VideoCall.stopCalling(pub) : VideoCall.callUser(pub));
  //$("#header-content").append(voiceCallBtn);
  $("#header-content").append(videoCallBtn);
  $("#header-content").css({cursor: 'pointer'});
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

function showProfile(pub) {
  if (!pub) {
    return;
  }
  resetView();
  setActiveProfile(pub);
  $('#profile .profile-photo-container').hide();
  var qrCodeEl = $('#profile-page-qr');
  qrCodeEl.empty();
  $('#profile-nickname-their').val('');
  $('#profile').show();
  addUserToHeader(pub);
  setTheirOnlineStatus(pub);
  renderGroupParticipants(pub);
  $('#profile .profile-photo').show();
  gun.user(pub).get('profile').get('photo').on(photo => {
    $('#profile .profile-photo-container').show();
    Helpers.setImgSrc($('#profile .profile-photo'), photo);
  });
  $('#profile .profile-about').toggle(chats[pub] && chats[pub].about && chats[pub].about.length > 0);
  $('#profile .profile-about-content').empty();
  $('#profile .profile-about-content').text(chats[pub] && chats[pub].about);
  const link = chats[pub] && chats[pub].getSimpleLink();
  $('#profile .add-friend').off().on('click', () => {
    console.log('add friend');
  });
  $('#profile .delete-chat').off().on('click', () => deleteChat(pub));
  $("input[name=notificationPreference][value=" + chats[pub].notificationSetting + "]").attr('checked', 'checked');
  $('input:radio[name=notificationPreference]').off().on('change', (event) => {
    chats[pub].put('notificationSetting', event.target.value);
  });
  $('#profile .send-message').off().on('click', () => showChat(pub));
  $('#profile .copy-user-link').off().on('click', event => {
    Helpers.copyToClipboard(link);
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
  $('.profile-nicknames').toggle(pub !== (Session.key && Session.key.pub));
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
  if (chats[pub] && chats[pub].uuid) {
    renderGroupPhotoSettings(chats[pub].uuid);
    $('#profile .profile-photo-container').show();
    Helpers.setImgSrc($('#profile .profile-photo'), chats[pub].photo);
  }
}

function init() {

}

export default {init, showProfile, setTheirOnlineStatus, addUserToHeader, getDisplayName, renderGroupParticipants};
