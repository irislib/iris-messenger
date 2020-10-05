import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {translate as t} from '../Translation.js';
import {localState, publicState, activeProfile} from '../Main.js';
import {chats, deleteChat, showChat, newChat} from '../Chat.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import PublicMessages from '../PublicMessages.js';
import MessageForm from './MessageForm.js';
import Message from './Message.js';
import ProfilePhotoPicker from './ProfilePhotoPicker.js';
import { route } from '../lib/preact-router.es.js';
import SafeImg from './SafeImg.js';
import CopyButton from './CopyButton.js';

class Profile extends Component {
  constructor() {
    super();
    this.eventListeners = [];
    this.sortedMessages = [];
  }

  onProfilePhotoSet(src) {
    if (this.isMyProfile) {
      publicState.user().get('profile').get('photo').put(src);
    } else {
      chats[this.props.id].put('photo', src);
    }
  }

  onAboutInput(e) {
    const about = $(e.target).text().trim();
    if (this.isMyProfile) {
      publicState.user().get('profile').get('about').put(about);
    } else {
      chats[this.props.id].put('about', about);
    }
  }

  onClickSettings() {
    this.isMyProfile ? route('/settings') : $('#chat-settings').toggle();
  }

  onNameInput(e) {
    const name = $(e.target).text().trim();
    if (name.length) {
      if (this.isMyProfile) {
        publicState.user().get('profile').get('name').put(name);
      } else {
        chats[this.props.id].put('name', name);
      }
    }
  }

  onFollowClick() {
    const follow = !this.state.youFollow;
    publicState.user().get('follow').get(this.props.id).put(follow);
    if (follow) {
      newChat(this.props.id);
    }
  }

  render() {
    const key = Session.getKey();
    this.isMyProfile = (key && key.pub) === this.props.id;
    const messageForm = this.isMyProfile ? html`<${MessageForm} activeChat="public"/>` : '';
    const editable = !!(this.isMyProfile || this.state.isAdmin);
    const followable = !(this.isMyProfile || this.props.id.length < 40);
    return html`
    <div class="main-view" id="profile">
      <div class="content">
        <div class="profile-top">
          <div class="profile-header">
            <div class="profile-photo-container">
              ${editable ?
                html`<${ProfilePhotoPicker} currentPhoto=${this.state.photo} callback=${src => this.onProfilePhotoSet(src)}/>` :
                html`<${SafeImg} class="profile-photo" src=${this.state.photo}/>`}
            </div>
            <div class="profile-header-stuff">
              <h3 class="profile-name" placeholder=${editable ? t('name') : ''} contenteditable=${editable} onInput=${e => this.onNameInput(e)}>${this.state.name}</h3>
              <div class="profile-about hidden-xs">
                <p class="profile-about-content" placeholder=${editable ? t('about') : ''} contenteditable=${editable} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
              </div>
              <div class="profile-actions">
                <div class="follow-count">
                  <a href="/follows/${this.props.id}">
                    <span>${this.state.followedUserCount}</span> ${t('following')}
                  </a>
                  <a href="/followers/${this.props.id}">
                    <span>${this.state.followerCount}</span> ${t('known_followers')}
                  </a>
                </div>
                ${this.state.followsYou ? html`
                  <p><small>${t('follows_you')}</small></p>
                `: ''}
                ${followable ? html`
                  <button class="follow ${this.state.youFollow ? 'following' : ''}" onClick=${() => this.onFollowClick()}>
                    <span class="nonhover">${this.state.youFollow ? t('following') : t('follow')}</span>
                    <span class="hover">${t('unfollow')}</span>
                  </button>
                ` : ''}
                <button class="send-message">${t('send_message')}</button>
                <${CopyButton} text=${t('copy_link')} copyStr=${'https://iris.to/' + window.location.hash}/>
                <button class="show-qr-code">${t('show_qr_code')}</button>
                ${this.isMyProfile ? '' : html`
                  <button class="show-settings" onClick=${() => this.onClickSettings()}>${t('settings')}</button>
                `}
              </div>
            </div>
          </div>
          <div class="profile-about visible-xs-flex">
            <p class="profile-about-content" placeholder=${this.isMyProfile ? t('about') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
          </div>

          <div id="profile-group-settings">
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
              <button class="delete-chat" onClick=${() => deleteChat(this.props.id)}>${t('delete_chat')}</button>
              <!-- <button class="block-user">${t('block_user')}</button> -->
            </p>
            <hr/>
          </div>
        </div>
        <div id="profile-public-messages">
          ${messageForm}
          <div class="public-messages-view">
            ${this.sortedMessages.map(msg =>
              html`<${Message} ...${msg} public=${true} key=${msg.time} showName=${true} name=${this.state.name}/>`
            )}
          </div>
        </div>
      </div>
    </div>`;
  }

  renderGroupParticipants() {
    const pub = this.props.id;
    if (!(chats[pub] && chats[pub].uuid)) {
      $('#profile-group-settings').hide();
      return;
    } else {
      $('#profile-group-settings').show();
    }
    $('#profile-group-participants').empty().show();
    var keys = Object.keys(chats[pub].participantProfiles);
    const isAdmin = areWeAdmin(pub);
    $('#profile-add-participant').toggle(isAdmin);
    $('#profile-group-name-container').toggle(isAdmin);
    this.setState({isAdmin});
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

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  componentDidUpdate() {
    this.componentDidMount();
  }

  componentDidMount() {
    const pub = this.props.id;
    if (pub === this.id) {
      return;
    }
    this.eventListeners.forEach(e => e.off());
    this.id = pub;
    this.sortedMessages = [];
    this.setState({followsYou:false, youFollow: false, followedUserCount: 0, followerCount: 0, name: '', photo: '', about: ''});
    const key = Session.getKey();
    this.isMyProfile = (key && key.pub) === pub;
    this.followedUsers = new Set();
    this.followers = new Set();
    const chat = chats[pub];
    localState.get('activeProfile').put(pub);
    var qrCodeEl = $('#profile-page-qr');
    qrCodeEl.empty();
    this.renderGroupParticipants();
    localState.get('chats').get(this.props.id).get('participants').on(() => {
      this.renderGroupParticipants();
      renderInviteLinks(pub);
    });
    if (!(chat && chat.uuid)) {
      publicState.user().get('follow').get(this.props.id).on((youFollow, a, b, e) => {
        this.setState({youFollow});
        this.eventListeners.push(e);
      });
      publicState.user(pub).get('follow').get(Session.getKey().pub).on((followsYou, a, b, e) => {
        this.setState({followsYou});
        this.eventListeners.push(e);
      });
      publicState.user(pub).get('follow').map().on((following,key,c,e) => {
        this.eventListeners.push(e);
        if (following) {
          this.followedUsers.add(key);
        } else {
          this.followedUsers.delete(key);
        }
        this.setState({followedUserCount: this.followedUsers.size});
      });
      publicState.user().get('follow').map().once((following,key) => {
        if (following) {
          publicState.user(key).get('follow').get(pub).once(following => {
            if (following) {
              this.followers.add(key);
              this.setState({followerCount: this.followers.size});
            }
          });
        }
      });
      publicState.user(pub).get('profile').get('name').on((name,a,b,e) => {
        this.eventListeners.push(e);
        if (!$('#profile .profile-name:focus').length) {
          this.setState({name});
        }
      });
      publicState.user(pub).get('profile').get('photo').on((photo,a,b,e) => {
        this.eventListeners.push(e);
        this.setState({photo});
      });
      publicState.user(pub).get('profile').get('about').on((about,a,b,e) => {
        this.eventListeners.push(e);
        if (!$('#profile .profile-about-content:focus').length) {
          this.setState({about});
        } else {
          $('#profile .profile-about-content:not(:focus)').text(about);
        }
      });
      PublicMessages.getMessages(pub, (msg, info) => {
        if (msg === null) {
          this.sortedMessages = this.sortedMessages.filter(m => !(m.time === info.time && m.info.from === info.from));
        } else {
          msg.info = info;
          this.sortedMessages.push(msg);
          this.sortedMessages.sort((a,b) => a.time < b.time ? 1 : -1);
        }
        this.setState({});
      });
    } else {
      chat.on('name', name => {
        if (!$('#profile .profile-name:focus').length) {
          this.setState({name});
        }
      });
      chat.on('photo', photo => this.setState({photo}));
      chat.on('about', about => {
        if (!$('#profile .profile-about-content:focus').length) {
          this.setState({about});
        } else {
          $('#profile .profile-about-content:not(:focus)').text(about);
        }
      });
    }
    if (chat) {
      $("input[name=notificationPreference][value=" + chat.notificationSetting + "]").attr('checked', 'checked');
      $('input:radio[name=notificationPreference]').off().on('change', (event) => {
        chat.put('notificationSetting', event.target.value);
      });
    }
    $('#profile .show-qr-code').off().on('click', () => $('#profile-page-qr').toggle());
    $('#profile .send-message').off().on('click', () => showChat(pub));
    $('#profile-group-name').not(':focus').val(chat && chat.name);
    $('#profile-group-name').off().on('input', event => {
      var name = event.target.value;
      chat.put('name', name);
    });
    $('#profile-nickname-my-container').toggle(!(chat && chat.uuid));
    $('#profile-nickname-their').not(':focus').val(chat && chat.theirNickname);
    $('#profile-nickname-my').text(chat && chat.myNickname && chat.myNickname.length ? chat.myNickname : '');
    $('#profile-nickname-their').off().on('input', event => {
      var nick = event.target.value;
      chat.put('nickname', nick);
    });
    qrCodeEl.empty();
    new QRCode(qrCodeEl[0], {
      text: 'https://iris.to/' + window.location.hash,
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

export default {Profile, renderInviteLinks};
