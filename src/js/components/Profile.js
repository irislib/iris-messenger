import { Component } from '../lib/preact.js';
import { render } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {translate as t} from '../Translation.js';
import {localState, publicState, activeProfile} from '../Main.js';
import {chats, deleteChat, showChat} from '../Chat.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import PublicMessages from '../PublicMessages.js';
import MessageForm from './MessageForm.js';
import Message from './Message.js';
import ProfilePhotoPicker from './ProfilePhotoPicker.js';
//import VideoCall from './VideoCall.js';
import { route } from '../lib/preact-router.es.js';

class Profile extends Component {
  onProfilePhotoSet(src) {
    chats[activeProfile].put('photo', src);
  }

  render() {
    const key = Session.getKey();
    this.isMyProfile = (key && key.pub) === this.props.id;
    const messageForm = this.isMyProfile ? html`<${MessageForm} activeChat="public"/>` : '';
    return html`
    <div class="main-view" id="profile">
      <div class="content">
        <div class="profile-top">
          <div class="profile-header">
            <div class="profile-photo-container">
              ${this.props.id === (Session.getKey() && Session.getKey().pub) ?
                html`<${ProfilePhotoPicker} currentPhoto=${Session.getMyProfilePhoto()} callback=${src => this.onProfilePhotoSet(src)}/>` :
                html`<img class="profile-photo"/>`}
            </div>
            <div class="profile-header-stuff">
              <div class="profile-actions">
                <button class="send-message">${t('send_message')}</button>
                <button class="copy-user-link">${t('copy_link')}</button>
                <button class="show-qr-code">${t('show_qr_code')}</button>
                <button class="show-settings">${t('settings')}</button>
                <!-- <button class="add-friend">${t('follow')}</button> -->
              </div>
              <div class="profile-about hidden-xs" style="display:none">
                <p class="profile-about-content"></p>
              </div>
            </div>
          </div>
          <div class="profile-about visible-xs-flex" style="display:none">
            <p class="profile-about-content"></p>
          </div>

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

          <p id="profile-page-qr" style="display:none" class="qr-container"></p>
          <div id="chat-settings" style="display:none">
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
            <hr/>
          </div>
        </div>
        <div id="profile-public-messages">
          ${messageForm}
          <div id="attachment-preview" style="display:none"></div>
          <br/>
          <div id="profile-public-message-list" class="public-messages-view"></div>
        </div>
      </div>
    </div>`;
  }

  componentDidUpdate() {
    this.componentDidMount();
  }

  componentDidMount() {
    const pub = this.props.id;
    if (!pub) {
      return;
    }
    const key = Session.getKey();
    this.isMyProfile = (key && key.pub) === pub;
    const chat = chats[pub];
    sortedPublicMessages = [];
    localState.get('activeProfile').put(pub);
    $('#profile .profile-photo-container').hide();
    var qrCodeEl = $('#profile-page-qr');
    qrCodeEl.empty();
    $('#profile-nickname-their').val('');
    $('#profile').show();
    renderGroupParticipants(pub);
    renderInviteLinks(pub);
    if (!(chat && chat.uuid)) {
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
    $('#profile .profile-about').toggle(chat && chat.about && chat.about.length > 0);
    $('#profile .profile-about-content').empty();
    $('#profile .profile-about-content').text(chat && chat.about);
    const link = chat && chat.getSimpleLink();
    $('#profile .add-friend').off().on('click', () => {
      console.log('add friend');
    });
    $('#profile .delete-chat').off().on('click', () => deleteChat(pub));
    if (chat) {
      $("input[name=notificationPreference][value=" + chat.notificationSetting + "]").attr('checked', 'checked');
      $('input:radio[name=notificationPreference]').off().on('change', (event) => {
        chat.put('notificationSetting', event.target.value);
      });
    }
    $('#profile .show-settings').off().on('click', () => {
      this.isMyProfile ? route('/settings') : $('#chat-settings').toggle();
    });
    $('#profile .show-qr-code').off().on('click', () => $('#profile-page-qr').toggle());
    $('#profile .send-message').off().on('click', () => showChat(pub));
    $('#profile .copy-user-link').off().on('click', event => {
      Helpers.copyToClipboard(link);
      var tgt = $(event.target);
      var originalText = tgt.text();
      var originalWidth = tgt.width();
      tgt.width(originalWidth);
      tgt.text(t('copied'));
      setTimeout(() => {
        tgt.text(originalText);
        tgt.css('width', '');
      }, 2000);
    });
    $('#profile-group-name').not(':focus').val(chat && chat.name);
    $('#profile-group-name').off().on('input', event => {
      var name = event.target.value;
      chat.put('name', name);
    });
    $('.profile-nicknames').toggle(!this.isMyProfile);
    $('#profile-nickname-my-container').toggle(!(chat && chat.uuid));
    $('#profile-nickname-their').not(':focus').val(chat && chat.theirNickname);
    $('#profile-nickname-my').text(chat && chat.myNickname && chat.myNickname.length ? chat.myNickname : '');
    $('#profile-nickname-their').off().on('input', event => {
      var nick = event.target.value;
      chat.put('nickname', nick);
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
    if (chat && chat.uuid) {
      renderGroupPhotoSettings(chat.uuid);
      $('#profile .profile-photo-container').show();
      Helpers.setImgSrc($('#profile .profile-photo'), chat.photo);
    }
    $('#profile-create-invite-link').click(onCreateInviteLink);
    $('#profile-add-participant').on('input', onProfileAddParticipantInput);
  }
}

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
      route('/profile/' + k);
    });
    $('#profile-group-participants').append(el);
  });
}

let sortedPublicMessages;

function onPublicMessage(msg, info) {
  if (activeProfile !== info.from) { return; }
  msg.info = info;
  sortedPublicMessages.push(msg);
  sortedPublicMessages.sort((a, b) => a.time > b.time ? 1 : -1);
  $('#profile-public-message-list').empty();
  sortedPublicMessages.forEach(msg => {
    const container = $('<div>');
    render(html`<${Message} ...${msg} public=${true} key=${msg.time} showName=${true} chatId=${info.from}/>`, container[0]);
    $('#profile-public-message-list').prepend(container.children()[0]);
  });
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
    $('#add-profile-photo').toggle(!chats[uuid].photo);
  }
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
  if (!chats[activeProfile]) { return; }
  chats[activeProfile].createChatLink();
}

export default {Profile, renderGroupParticipants, renderInviteLinks};
