import { html, render } from '../lib/htm.preact.js';
import {translate as t} from '../Translation.js';
import {localState, publicState, resetView, activeChat, activeProfile} from '../Main.js';
import {chats, deleteChat, showChat} from '../Chat.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import PublicMessages from '../PublicMessages.js';
import Message from './Message.js';
//import VideoCall from './VideoCall.js';

const Profile = () => html`<div class="main-view" id="profile">
  <div class="profile-photo-container">
  <img class="profile-photo"/></div>
  <div class="content">
    <div id="profile-group-settings">
      <div id="profile-group-name-container">${t('group_name')}: <input id="profile-group-name" placeholder="${t('group_name')}"/></div>
      <p>${t('participants')}:</p>
      <div id="profile-group-participants"></div>
      <div id="profile-add-participant" style="display:none;">
        <p>${t('add_participant')}:</p>
        <p><input id="profile-add-participant-input" type="text" style="width: 220px" placeholder="${t('new_participants_chat_link')}"/></p>
      </div>
      <hr/>
      <p>${t('invite_links')}</p>
      <div id="profile-invite-links" class="flex-table"></div>
      <p><button id="profile-create-invite-link">Create new invite link</button></p>
      <hr/>
    </div>
    <div class="profile-about" style="display:none">
      <p class="profile-about-content"></p>
    </div>
    <p class="status"></p>
    <p class="last-active"></p>
    <!--
    <p>
      <button class="add-friend">${t('add_friend')}</button>
    </p>
    <p>
      <small>Friends can optionally direct connect to each other and store each others' encrypted data.</small>
    </p>
  -->
    <p>
      <button class="send-message">${t('send_message')}</button>
      <button class="copy-user-link">${t('copy_link')}</button>
    </p>
    <p id="profile-page-qr" class="qr-container"></p>
    <hr/>
    <h3>${t('chat_settings')}</h3>
    <div class="profile-nicknames">
      <h4>${t('nicknames')}</h4>
      <p>
        ${t('nickname')}: <input id="profile-nickname-their"/>
      </p>
      <p id="profile-nickname-my-container">
        ${t('their_nickname_for_you')}: <span id="profile-nickname-my"></span>
      </p>
    </div>
    <div class="notification-settings">
      <h4>${t('notifications')}</h4>
      <input type="radio" id="notifyAll" name="notificationPreference" value="all"/>
      <label for="notifyAll">${t('all_messages')}</label><br/>
      <input type="radio" id="notifyMentionsOnly" name="notificationPreference" value="mentions"/>
      <label for="notifyMentionsOnly">${t('mentions_only')}</label><br/>
      <input type="radio" id="notifyNothing" name="notificationPreference" value="nothing"/>
      <label for="notifyNothing">${t('nothing')}</label><br/>
    </div>
    <hr/>
    <p>
      <button class="delete-chat">${t('delete_chat')}</button>
      <!-- <button class="block-user">${t('block_user')}</button> -->
    </p>
    <div id="profile-public-messages">
      <hr/>
      <h3>${t('public_messages')}</h3>
      <div id="profile-public-message-list" class="public-messages-view"></div>
    </div>
  </div>
</div>`;

function renderGroupParticipants(pub) {
  if (!(chats[pub] && chats[pub].uuid)) {
    $('#profile-group-settings').hide();
    return;
  } else {
    $('#profile-group-settings').show();
  }
  $('#profile-group-participants').empty().show();
  var keys = Object.keys(chats[pub].participantProfiles);
  var me = chats[pub].participantProfiles[Session.getKey().pub];
  if (me && me.permissions) {
    $('#profile-add-participant').toggle(me.permissions.admin);
    $('#profile-group-name-container').toggle(me.permissions.admin);
  }
  keys.forEach(k => {
    var profile = chats[pub].participantProfiles[k];
    var identicon = Helpers.getIdenticon(k, 40).css({'margin-right':15});
    var nameEl = $('<span>');
    publicState.user(k).get('profile').get('name').on(name => nameEl.text(name));
    var el = $('<p>').css({display:'flex', 'align-items': 'center', 'cursor':'pointer'});
    $('<button>').css({'margin-right': 15}).text(t('remove')).click(() => {
      el.remove();
      // TODO remove group participant
    });
    //el.append(removeBtn);
    el.append(identicon);
    el.append(nameEl);
    if (profile.permissions && profile.permissions.admin) {
      el.append($('<small>').text(t('admin')).css({'margin-left': 5}));
    }
    el.click(() => {
      k === Session.getKey().pub ? $(".user-info").click() : showProfile(k);
    });
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
  const chat = chats[pub];
  $('#header-content').empty();
  var nameEl = $('<div class="name"></div>');
  if (pub === Session.getKey().pub && activeProfile !== pub) {
    nameEl.html("📝 <b>" + t('note_to_self') + "</b>");
  } else if (chat) {
    nameEl.text(getDisplayName(pub));
  }
  nameEl.show();

  if (pub !== 'public') {
    var identicon = Helpers.getIdenticon(pub, 40);
    var img = identicon.children('img').first();
    img.attr('height', 40).attr('width', 40);
    $("#header-content").append($('<div>').addClass('identicon-container').append(identicon));
  }
  var textEl = $('<div>').addClass('text');
  textEl.append(nameEl);
  const isTyping = chat && chat.isTyping;
  textEl.append($('<small>').addClass('last-seen').toggle(!isTyping));
  textEl.append($('<small>').addClass('typing-indicator').text(t('typing')).toggle(isTyping));
  if (chat && chat.uuid) {
    var text = Object.keys(chat.participantProfiles).map(p => chat.participantProfiles[p].name).join(', ');
    var namesEl = $('<small>').addClass('participants').text(text).toggle(!isTyping);
    textEl.append(namesEl);
    if (chat.photo) {
      identicon.hide();
      var photo = Helpers.setImgSrc($('<img>'), chat.photo).attr('height', 40).attr('width', 40).css({'border-radius': '50%'});
      $('#header-content .identicon-container').append(photo);
    }
  }
  $("#header-content").append(textEl);
  textEl.on('click', () => showProfile(pub));
  /* disabled for now because videochat is broken
  if (!chats[pub].uuid) {
    var videoCallBtn = $(`<a class="tooltip"><span class="tooltiptext">${t('video_call')}</span><svg enable-background="new 0 0 50 50" id="Layer_1" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="none" style="height:24px;width:24px"/><polygon fill="none" points="49,14 36,21 36,29   49,36 " stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/><path d="M36,36c0,2.209-1.791,4-4,4  H5c-2.209,0-4-1.791-4-4V14c0-2.209,1.791-4,4-4h27c2.209,0,4,1.791,4,4V36z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/></svg></a>`).attr('id', 'start-video-call').css({width:24, height:24, color: 'var(--msg-form-button-color)'});
    videoCallBtn.click(() => VideoCall.isCalling() ? null : VideoCall.callUser(pub));
    var voiceCallBtn = $('<a><svg enable-background="new 0 0 50 50" style="height:20px;width:20px" id="Layer_1" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="none" height="50" width="50"/><path d="M30.217,35.252c0,0,4.049-2.318,5.109-2.875  c1.057-0.559,2.152-0.7,2.817-0.294c1.007,0.616,9.463,6.241,10.175,6.739c0.712,0.499,1.055,1.924,0.076,3.32  c-0.975,1.396-5.473,6.916-7.379,6.857c-1.909-0.062-9.846-0.236-24.813-15.207C1.238,18.826,1.061,10.887,1,8.978  C0.939,7.07,6.459,2.571,7.855,1.595c1.398-0.975,2.825-0.608,3.321,0.078c0.564,0.781,6.124,9.21,6.736,10.176  c0.419,0.66,0.265,1.761-0.294,2.819c-0.556,1.06-2.874,5.109-2.874,5.109s1.634,2.787,7.16,8.312  C27.431,33.615,30.217,35.252,30.217,35.252z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="4"/></svg></a>').css({width:20, height:20, 'margin-right': 20});
    voiceCallBtn.click(() => VideoCall.isCalling() ? VideoCall.stopCalling(pub) : VideoCall.callUser(pub));
    //$("#header-content").append(voiceCallBtn);
    $("#header-content").append(videoCallBtn);
  }*/
  $("#header-content").css({cursor: 'pointer'});
}

function setTheirOnlineStatus(pub) {
  if (!chats[pub]) return;
  var online = chats[pub].online;
  if (online && (activeChat === pub || activeProfile === pub)) {
    if (online.isOnline) {
      $('#header-content .last-seen').text(t('online'));
    } else if (online.lastActive) {
      var d = new Date(online.lastActive);
      var lastSeenText = t(iris.util.getDaySeparatorText(d, d.toLocaleDateString({dateStyle:'short'})));
      if (lastSeenText === t('today')) {
        lastSeenText = iris.util.formatTime(d);
      } else {
        lastSeenText = iris.util.formatDate(d);
      }
      $('#header-content .last-seen').text(t('last_active') + ' ' + lastSeenText);
    }
  }
}

function onPublicMessage(msg, info) {
  if (activeProfile !== info.from) { return; }
  const container = $('<div>');
  render(html`<${Message} ...${msg} showName=${true} chatId=${info.from}/>`, container[0]);
  $('#profile-public-message-list').prepend(container.children()[0]);
}

function showProfile(pub) {
  if (!pub) {
    return;
  }
  resetView();
  localState.get('activeProfile').put(pub);
  $('#profile .profile-photo-container').hide();
  var qrCodeEl = $('#profile-page-qr');
  qrCodeEl.empty();
  $('#profile-nickname-their').val('');
  $('#profile').show();
  addUserToHeader(pub);
  setTheirOnlineStatus(pub);
  renderGroupParticipants(pub);
  renderInviteLinks(pub);
  if (chats[pub] && !chats[pub].uuid) {
    $('#profile-public-message-list').empty();
    $('#profile-public-messages').show();
    $('#profile .profile-photo').show();
    publicState.user(pub).get('profile').get('photo').on(photo => {
      $('#profile .profile-photo-container').show();
      Helpers.setImgSrc($('#profile .profile-photo'), photo);
    });
    PublicMessages.getMessages(onPublicMessage, pub);
  } else {
    $('#profile-public-messages').hide();
  }
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
    var tgt = $(event.target);
    var originalText = tgt.text();
    var originalWidth = tgt.width();
    t.width(originalWidth);
    t.text(t('copied'));
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
  $('.profile-nicknames').toggle(pub !== Session.getKey().pub);
  $('#profile-nickname-my-container').toggle(!chats[pub].uuid);
  $('#profile-nickname-their').not(':focus').val(chats[pub] && chats[pub].theirNickname);
  $('#profile-nickname-my').text(chats[pub] && chats[pub].myNickname && chats[pub].myNickname.length ? chats[pub].myNickname : '');
  $('#profile-nickname-their').off().on('input', event => {
    var nick = event.target.value;
    chats[pub].put('nickname', nick);
  });
  qrCodeEl.empty();
  new QRCode(qrCodeEl[0], {
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

var newGroupParticipant;
function onProfileAddParticipantInput(event) {
  var val = $(event.target).val();
  if (val.length < 30) {
    return;
  }
  var s = val.split('?');
  if (s.length !== 2) { return; }
  var pub = Helpers.getUrlParameter('chatWith', s[1]);
  $('#profile-add-participant-input').hide();
  if (pub) {
    $('#profile-add-participant-candidate').remove();
    var identicon = Helpers.getIdenticon(pub, 40).css({'margin-right':15});
    var nameEl = $('<span>');
    publicState.user(pub).get('profile').get('name').on(name => nameEl.text(name));
    var el = $('<p>').css({display:'flex', 'align-items': 'center'}).attr('id', 'profile-add-participant-candidate');
    var addBtn = $('<button>').css({'margin-left': 15}).text(t('add')).click(() => {
      if (newGroupParticipant) {
        chats[activeProfile].addParticipant(newGroupParticipant);
        newGroupParticipant = null;
        $('#profile-add-participant-input').val('').show();
        $('#profile-add-participant-candidate').remove();
      }
    });
    var removeBtn = $('<button>').css({'margin-left': 15}).text(t('cancel')).click(() => {
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
}

function renderGroupPhotoSettings(uuid) {
  const me = chats[uuid].participantProfiles[Session.getKey().pub];
  const isAdmin = !!(me && me.permissions && me.permissions.admin);
  if (me && me.permissions) {
    $('#profile-add-participant').toggle(isAdmin);
    $('#profile-group-name-container').toggle(isAdmin);
  }
  $('#current-profile-photo').toggle(!!chats[uuid].photo);
  $('#profile .profile-photo').toggle(!!chats[uuid].photo);
  if (isAdmin) {
    Helpers.setImgSrc($('#current-profile-photo'), chats[uuid].photo);
    $('#profile .profile-photo').hide();
    renderProfilePhotoSettings();
    var el = $('#profile-photo-settings');
    $('#profile-group-settings').prepend(el);
    $('#add-profile-photo').toggle(!chats[uuid].photo);
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
    Helpers.getBase64(file).then(base64 => {
      var previewEl = $('#profile-photo-preview');
      Helpers.setImgSrc(previewEl, base64);
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
    if (!$('#current-profile-photo').attr('src')) {
      $('#add-profile-photo').show();
    }
    Helpers.setImgSrc($('#profile-photo-preview'), '');
    $('#profile-photo-preview').toggleClass('hidden', true);
    $('#cancel-profile-photo').toggleClass('hidden', true);
    $('#use-profile-photo').toggleClass('hidden', true);
  }
}

function useProfilePhotoClicked() {
  var canvas = cropper.getCroppedCanvas();
  var resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = resizedCanvas.height = Math.min(canvas.width, 800);
  pica().resize(canvas, resizedCanvas).then(() => {
    var src = resizedCanvas.toDataURL('image/jpeg');
    // var src = $('#profile-photo-preview').attr('src');
    if (activeProfile) {
      chats[activeProfile].put('photo', src);
    } else {
      publicState.user().get('profile').get('photo').put(src);
    }
    Helpers.setImgSrc($('#current-profile-photo'), src);
    $('#profile-photo-input').val(null);

    renderProfilePhotoSettings();
  });
}

function removeProfilePhotoClicked() {
  if (activeProfile) {
    chats[activeProfile].put('photo', null);
  } else {
    publicState.user().get('profile').get('photo').put(null);
  }
  renderProfilePhotoSettings();
}

function areWeAdmin(uuid) {
  const me = chats[uuid].participantProfiles[Session.getKey().pub];
  return !!(me && me.permissions && me.permissions.admin);
}

function renderInviteLinks(pub) {
  if (!(chats[pub] && chats[pub].inviteLinks)) { return; }
  const isAdmin = areWeAdmin(pub);
  $('#profile-create-invite-link').toggle(isAdmin);
  $('#profile-invite-links').empty();
  Object.values(chats[pub].inviteLinks).forEach(url => {
    const row = $('<div>').addClass('flex-row');
    const copyBtn = $('<button>').text(t('copy')).width(100);
    copyBtn.on('click', event => {
      Helpers.copyToClipboard(url);
      var target = $(event.target);
      var originalText = target.text();
      target.text(t('copied'));
      setTimeout(() => {
        t.text(originalText);
      }, 2000);
    });
    const copyDiv = $('<div>').addClass('flex-cell no-flex').append(copyBtn);
    row.append(copyDiv);
    const input = $('<input>').attr('type', 'text').val(url);
    input.on('click', () => input.select());
    row.append($('<div>').addClass('flex-cell').append(input));
    if (isAdmin) {
      const removeBtn = $('<button>').text(t('remove'));
      row.append($('<div>').addClass('flex-cell no-flex').append(removeBtn));
    }
    $('#profile-invite-links').append(row);
  });
}

function onCreateInviteLink() {
  console.log(4);
  if (!chats[activeProfile]) { return; }
  chats[activeProfile].createChatLink();
}

function init() {
  $('#profile-create-invite-link').click(onCreateInviteLink);
  $('#profile-add-participant').on('input', onProfileAddParticipantInput);
  $('#current-profile-photo, #add-profile-photo').click(() => $('#profile-photo-input').click());
  $('#profile-photo-input').change(renderProfilePhotoSettings);
  $('#use-profile-photo').click(useProfilePhotoClicked);
  $('#cancel-profile-photo').click(() => {
    $('#profile-photo-input').val(null);
    renderProfilePhotoSettings();
  });
  $('#remove-profile-photo').click(removeProfilePhotoClicked);
}

export default {Profile, init, showProfile, setTheirOnlineStatus, addUserToHeader, getDisplayName, renderGroupParticipants, renderInviteLinks, renderGroupPhotoSettings};
