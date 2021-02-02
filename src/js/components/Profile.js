import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {translate as t} from '../Translation.js';
import State from '../State.js';
import {chats, deleteChat} from '../Chat.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import MessageForm from './MessageForm.js';
import ProfilePhotoPicker from './ProfilePhotoPicker.js';
import { route } from '../lib/preact-router.es.js';
import SafeImg from './SafeImg.js';
import CopyButton from './CopyButton.js';
import FollowButton from './FollowButton.js';
import MessageFeed from './MessageFeed.js';
import Identicon from './Identicon.js';
import Name from './Name.js';
import SearchBox from './SearchBox.js';

class Profile extends Component {
  constructor() {
    super();
    this.eventListeners = [];
    this.followedUsers = new Set();
    this.followers = new Set();
  }

  onProfilePhotoSet(src) {
    if (this.isMyProfile) {
      State.public.user().get('profile').get('photo').put(src);
    } else {
      chats[this.props.id].put('photo', src);
    }
  }

  onAboutInput(e) {
    const about = $(e.target).text().trim();
    if (this.isMyProfile) {
      State.public.user().get('profile').get('about').put(about);
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
        State.public.user().get('profile').get('name').put(name);
      } else {
        chats[this.props.id].put('name', name);
      }
    }
  }

  getNotification() {
    if (this.state.noFollowers && this.followers.has(Session.getPubKey())) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>Share your profile link so ${this.state.name || 'this user'} can follow you:</p>
            <p><${CopyButton} text=${t('copy_link')} title=${Session.getMyName()} copyStr=${Helpers.getProfileLink(Session.getPubKey())}/></p>
            <small>Your posts, replies and likes are only shown to your followers and their network.</small>
          </div>
        </div>
      `;
    }
  }

  onSelectCandidate(pub) {
    console.log('onSelectCandidate', pub);
    $('#profile-add-participant-input').hide();
    if (pub) {
      $('#profile-add-participant-candidate').remove();
      var identicon = Helpers.getIdenticon(pub, 40).css({'margin-right':15});
      var nameEl = $('<span>');
      State.public.user(pub).get('profile').get('name').on(name => nameEl.text(name));
      var el = $('<p>').css({display:'flex', 'align-items': 'center'}).attr('id', 'profile-add-participant-candidate');
      var addBtn = $('<button>').css({'margin-left': 15}).text(t('add')).click(() => {
        if (newGroupParticipant) {
          chats[this.props.id].addParticipant(newGroupParticipant);
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

  onAddParticipant(add = true) {
    add && chats[this.props.id].addParticipant(this.state.memberCandidate);
    this.setState({memberCandidate:null});
  }

  renderGroupSettings() {
    const chat = chats[this.props.id];
    if (chat && chat.uuid) {
      return html`
        <div>
          <p>${t('participants')}:</p>
          <div>
            ${
              chat ? Object.keys(chat.participantProfiles).map(k => {
                const profile = chat.participantProfiles[k];
                return html`
                  <div class="profile-link-container">
                    <a class="profile-link" onClick=${() => route('/profile/' + k)}>
                      <${Identicon} str=${k} width=40/>
                      <${Name} pub=${k}/>
                      ${profile.permissions && profile.permissions.admin ? html`
                        <small style="margin-left:5px">${t('admin')}</small>
                      `: ''}
                    </a>
                  </div>
                `;
              }) : ''
            }
          </div>
          ${this.state.isAdmin ? html`
            <div>
              <p>${t('add_participant')}:</p>
              <p>
              ${this.state.memberCandidate ? html`
                <div class="profile-link-container"><div class="profile-link">
                  <${Identicon} str=${this.state.memberCandidate} width=40/>
                  <${Name} pub=${this.state.memberCandidate}/>
                </div>
                <button onClick=${() => this.onAddParticipant()}>Add</button>
                <button onClick=${() => this.onAddParticipant(false)}>Cancel</button>
                </div>
              `: html`
                <${SearchBox} onSelect=${item => this.setState({memberCandidate: item.key})}/>
              `}
              </p>
            </div>
          `: ''}
          ${chat && chat.inviteLinks && Object.keys(chat.inviteLinks).length ? html`
            <hr/>
            <p>${t('invite_links')}</p>
            <div class="flex-table">
              ${Object.keys(chat.inviteLinks).map(id => {
                const url = chat.inviteLinks[id];
                return html`
                  <div class="flex-row">
                    <div class="flex-cell no-flex">
                      <${CopyButton} copyStr=${url}/>
                    </div>
                    <div class="flex-cell">
                      <input type="text" value=${url} onClick=${e => $(e.target).select()}/>
                    </div>
                    ${this.state.isAdmin ? html`
                      <div class="flex-cell no-flex">
                        <button onClick=${() => Session.removeChatLink(id)}>${t('remove')}</button>
                      </div>
                    `: ''}
                  </div>
                `;
              })}
            </div>
          `: ''}
          ${this.state.isAdmin ? html`
            <p><button onClick=${() => chat.createChatLink()}>Create new invite link</button></p><hr/>
          `: ''}
        </div>
      `;
    }
    return '';
  }

  render() {
    this.isMyProfile = Session.getPubKey() === this.props.id;
    const chat = chats[this.props.id];
    const uuid = chat && chat.uuid;
    const messageForm = this.isMyProfile ? html`<${MessageForm} class="hidden-xs" autofocus=${false} activeChat="public"/>` : '';
    const editable = !!(this.isMyProfile || this.state.isAdmin);
    const followable = !(this.isMyProfile || this.props.id.length < 40);
    let profilePhoto;
    if (editable) {
      profilePhoto = html`<${ProfilePhotoPicker} currentPhoto=${this.state.photo} placeholder=${this.props.id} callback=${src => this.onProfilePhotoSet(src)}/>`;
    } else {
      if (this.state.photo) {
        profilePhoto = html`<${SafeImg} class="profile-photo" src=${this.state.photo}/>`
      } else {
        profilePhoto = html`<${Identicon} str=${this.props.id} width=250/>`
      }
    }
    return html`
    <div class="main-view" id="profile">
      <div class="content">
        <div class="profile-top">
          <div class="profile-header">
            <div class="profile-photo-container">
              ${profilePhoto}
            </div>
            <div class="profile-header-stuff">
              <h3 class="profile-name" placeholder=${editable ? t('name') : ''} contenteditable=${editable} onInput=${e => this.onNameInput(e)}>${this.state.name}</h3>
              <div class="profile-about hidden-xs">
                <p class="profile-about-content" placeholder=${editable ? t('about') : ''} contenteditable=${editable} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
              </div>
              <div class="profile-actions">
                ${uuid ? '' : html`
                  <div class="follow-count">
                    <a href="/follows/${this.props.id}">
                      <span>${this.state.followedUserCount}</span> ${t('following')}
                    </a>
                    <a href="/followers/${this.props.id}">
                      <span>${this.state.followerCount}</span> ${t('known_followers')}
                    </a>
                  </div>
                `}
                ${this.followedUsers.has(Session.getPubKey()) ? html`
                  <p><small>${t('follows_you')}</small></p>
                `: ''}
                ${followable ? html`<${FollowButton} id=${this.props.id}/>` : ''}
                <button onClick=${() => route('/chat/' + this.props.id)}>${t('send_message')}</button>
                ${uuid ? '' : html`
                  <${CopyButton} text=${t('copy_link')} title=${this.state.name} copyStr=${'https://iris.to/' + window.location.hash}/>
                `}
                <button onClick=${() => $('#profile-page-qr').toggle()}>${t('show_qr_code')}</button>
                ${this.isMyProfile ? '' : html`
                  <button class="show-settings" onClick=${() => this.onClickSettings()}>${t('settings')}</button>
                `}
              </div>
            </div>
          </div>
          <div class="profile-about visible-xs-flex">
            <p class="profile-about-content" placeholder=${this.isMyProfile ? t('about') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
          </div>

          ${this.renderGroupSettings()}

          <p id="profile-page-qr" style="display:none" class="qr-container"></p>
          <div id="chat-settings" style="display:none">
            <hr/>
            <h3>${t('chat_settings')}</h3>
            <div class="profile-nicknames">
              <h4>${t('nicknames')}</h4>
              <p>
                ${t('nickname')}:
                <input value=${chat && chat.theirNickname} onInput=${e => chat && chat.put('nickname', e.target.value)}/>
              </p>
              ${uuid ? '' : html`
                <p>
                  ${t('their_nickname_for_you')}:
                  <span>
                    ${chat && chat.myNickname && chat.myNickname.length ? chat.myNickname : ''}
                  </span>
                </p>
              `}
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
        ${uuid ? '' : html`
          <div>
            ${messageForm}
            <div class="public-messages-view">
              ${this.getNotification()}
              <${MessageFeed} node=${State.public.user(this.props.id).get('msgs')} />
            </div>
          </div>
        `}
      </div>
    </div>`;
  }

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.setState({isAdmin:false,uuid:null, memberCandidate:null});
      this.componentDidMount();
    }
  }

  userDidMount() {
    const pub = this.props.id;
    State.public.user(pub).get('follow').map().on((following,key,c,e) => {
      this.eventListeners.push(e);
      if (following) {
        this.followedUsers.add(key);
      } else {
        this.followedUsers.delete(key);
      }
      this.setState({followedUserCount: this.followedUsers.size});
    });
    State.local.get('follows').map().once((following,key) => {
      if (following) {
        State.public.user(key).get('follow').get(pub).once(following => {
          if (following) {
            this.followers.add(key);
            this.setState({followerCount: this.followers.size});
          }
        });
      }
    });
    State.public.user(pub).get('profile').get('name').on((name,a,b,e) => {
      document.title = name || document.title;
      this.eventListeners.push(e);
      if (!$('#profile .profile-name:focus').length) {
        this.setState({name});
      }
    });
    State.public.user(pub).get('profile').get('photo').on((photo,a,b,e) => {
      this.eventListeners.push(e);
      this.setState({photo});
    });
    State.public.user(pub).get('profile').get('about').on((about,a,b,e) => {
      this.eventListeners.push(e);
      if (!$('#profile .profile-about-content:focus').length) {
        this.setState({about});
      } else {
        $('#profile .profile-about-content:not(:focus)').text(about);
      }
    });
  }

  groupDidMount() {
    const chat = chats[this.props.id];
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
    renderGroupPhotoSettings(chat.uuid);
    $('#profile .profile-photo-container').show();
    Helpers.setImgSrc($('#profile .profile-photo'), chat.photo);
  }

  componentDidMount() {
    const pub = this.props.id;
    this.eventListeners.forEach(e => e.off());
    this.setState({followedUserCount: 0, followerCount: 0, name: '', photo: '', about: ''});
    this.isMyProfile = Session.getPubKey() === pub;
    const chat = chats[pub];
    if (pub.length < 40) {
      if (!chat) {
        const interval = setInterval(() => {
          if (chats[pub]) {
            clearInterval(interval);
            this.componentDidMount();
          }
        }, 1000);
      }
    }
    var qrCodeEl = $('#profile-page-qr');
    qrCodeEl.empty();
    State.local.get('noFollowers').on(noFollowers => this.setState({noFollowers}));
    State.local.get('inviteLinksChanged').on(() => this.setState({}));
    State.local.get('chats').get(this.props.id).get('participants').on(() => {
      const isAdmin = areWeAdmin(pub);
      this.setState({isAdmin});
    });
    if (chat && chat.uuid) {
      this.groupDidMount();
    } else {
      this.userDidMount();
    }
    if (chat) {
      $("input[name=notificationPreference][value=" + chat.notificationSetting + "]").attr('checked', 'checked');
      $('input:radio[name=notificationPreference]').off().on('change', (event) => {
        chat.put('notificationSetting', event.target.value);
      });
    }
    qrCodeEl.empty();
    new QRCode(qrCodeEl[0], {
      text: 'https://iris.to/' + window.location.hash,
      width: 300,
      height: 300,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  }
}

var newGroupParticipant;

function renderGroupPhotoSettings(uuid) {
  const me = chats[uuid].participantProfiles[Session.getKey().pub];
  const isAdmin = !!(me && me.permissions && me.permissions.admin);
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

export default {Profile};
