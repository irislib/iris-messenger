import { html } from '../Helpers.js';
import {translate as t} from '../Translation.js';
import State from '../State.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import MessageForm from '../components/MessageForm.js';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker.js';
import { route } from '../lib/preact-router.es.js';
import SafeImg from '../components/SafeImg.js';
import CopyButton from '../components/CopyButton.js';
import FollowButton from '../components/FollowButton.js';
import BlockButton from '../components/BlockButton.js';
import MessageFeed from '../components/MessageFeed.js';
import Identicon from '../components/Identicon.js';
import Name from '../components/Name.js';
import View from './View.js';
import SearchBox from '../components/SearchBox.js';

const SMS_VERIFIER_PUB = 'ysavwX9TVnlDw93w9IxezCJqSDMyzIU-qpD8VTN5yko.3ll1dFdxLkgyVpejFkEMOFkQzp_tRrkT3fImZEx94Co';

function deleteChat(pub) {
  iris.Channel.deleteChannel(State.public, Session.getKey(), pub);
  delete Session.channels[pub];
  State.local.get('channels').get(pub).put(null);
}

class Profile extends View {
  constructor() {
    super();
    this.eventListeners = [];
    this.followedUsers = new Set();
    this.followers = new Set();
    this.id = "profile";
  }

  onProfilePhotoSet(src) {
    Session.channels[this.props.id].put('photo', src);
  }

  onAboutInput(e) {
    const about = $(e.target).text().trim();
    Session.channels[this.props.id].put('about', about);
  }

  onClickSettings() {
    $('#chat-settings').toggle();
  }

  onNameInput(e) {
    const name = $(e.target).text().trim();
    if (name.length) {
      Session.channels[this.props.id].put('name', name);
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
          Session.channels[this.props.id].addParticipant(newGroupParticipant);
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
    add && Session.channels[this.props.id].addParticipant(this.state.memberCandidate);
    this.setState({memberCandidate:null});
  }

  onRemoveParticipant(pub) {
    console.log('onRemoveParticipant', pub);
    Session.channels[this.props.id].removeParticipant(pub);
  }

  renderGroupSettings() {
    const chat = Session.channels[this.props.id];
    if (chat && chat.uuid) {
      return html`
        <div>
          <p>${t('participants')}:</p>
          <div class="flex-table">
            ${
              chat ? Object.keys(chat.participantProfiles).map(k => {
                const profile = chat.participantProfiles[k];
                if (!(profile.permissions && profile.permissions.read && profile.permissions.write)) { return; }
                return html`
                  <div class="flex-row">
                    <div class="flex-cell">
                      <div class="profile-link-container">
                        <a class="profile-link" onClick=${() => route('/profile/' + k)}>
                          <${Identicon} str=${k} width=40/>
                          <${Name} pub=${k}/>
                          ${profile.permissions && profile.permissions.admin ? html`
                            <small style="margin-left:5px">${t('admin')}</small>
                          `: ''}
                        </a>
                      </div>
                    </div>
                    ${this.state.isAdmin ? html`
                      <div class="flex-cell no-flex">
                        <button onClick=${() => this.onRemoveParticipant(k)}>${t('remove')}</button>
                      </div>
                    ` : ''}
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

  renderView() {
    const chat = Session.channels[this.props.id];
    const uuid = chat && chat.uuid;
    const editable = this.state.isAdmin;
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
                      <span>${this.state.followerCount}</span> ${t('followers')}
                    </a>
                  </div>
                `}
                ${this.followedUsers.has(Session.getPubKey()) ? html`
                  <p><small>${t('follows_you')}</small></p>
                `: this.props.id === SMS_VERIFIER_PUB ? html`
                  <p><a href="https://iris-sms-auth.herokuapp.com/?pub=${Session.getPubKey()}">${t('ask_for_verification')}</a></p>
                ` : ''}
                <button onClick=${() => route('/chat/' + this.props.id)}>${t('send_message')}</button>
                ${uuid ? '' : html`
                  <${CopyButton} text=${t('copy_link')} title=${this.state.name} copyStr=${'https://iris.to/' + window.location.hash}/>
                `}
                <button onClick=${() => $('#profile-page-qr').toggle()}>${t('show_qr_code')}</button>
                <button class="show-settings" onClick=${() => this.onClickSettings()}>${t('settings')}</button>
              </div>
            </div>
          </div>
          <div class="profile-about visible-xs-flex">
            <p class="profile-about-content" placeholder=${editable ? t('about') : ''} contenteditable=${editable} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
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
            </p>
            <hr/>
          </div>
        </div>
      </div>
    `;
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
    const chat = Session.channels[this.props.id];
    chat.on('name', name => { // TODO: this really needs unsubscribe
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
    const chat = Session.channels[pub];
    if (pub.length < 40) {
      if (!chat) {
        const interval = setInterval(() => {
          if (Session.channels[pub]) {
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
    State.local.get('channels').get(this.props.id).get('participants').on(() => {
      const isAdmin = areWeAdmin(pub);
      this.setState({isAdmin});
    });
    this.groupDidMount();
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
  const me = Session.channels[uuid].participantProfiles[Session.getKey().pub];
  const isAdmin = !!(me && me.permissions && me.permissions.admin);
  $('#current-profile-photo').toggle(!!Session.channels[uuid].photo);
  $('#profile .profile-photo').toggle(!!Session.channels[uuid].photo);
  if (isAdmin) {
    Helpers.setImgSrc($('#current-profile-photo'), Session.channels[uuid].photo);
    $('#profile .profile-photo').hide();
  }
}

function areWeAdmin(uuid) {
  const me = Session.channels[uuid].participantProfiles[Session.getKey().pub];
  return !!(me && me.permissions && me.permissions.admin);
}

export default Profile;
