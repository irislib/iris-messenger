import { html } from 'htm/preact';
import {translate as tr} from '../Translation.js';
import State from '../State.js';
import Session from '../Session.js';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker.js';
import { route } from 'preact-router';
import SafeImg from '../components/SafeImg.js';
import CopyButton from '../components/CopyButton.js';
import Identicon from '../components/Identicon.js';
import Name from '../components/Name.js';
import View from './View.js';
import SearchBox from '../components/SearchBox.js';
import $ from 'jquery';
import QRCode from '../lib/qrcode.min.js';
import iris from 'iris-lib';

function deleteChat(pub) {
  iris.Channel.deleteChannel(State.public, Session.getKey(), pub);
  delete Session.channels[pub];
  State.local.get('channels').get(pub).put(null);
}

class Group extends View {
  constructor() {
    super();
    this.eventListeners = [];
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

  removeChatLink(id) {
    if (confirm("Remove chat link?")) {
      State.local.get('chatLinks').get(id).put(null);
      Session.channels[this.props.id].removeGroupChatLink(id);
    }
  }

  onAddParticipant(add = true) {
    add && Session.channels[this.props.id].addParticipant(this.state.memberCandidate);
    this.setState({memberCandidate:null});
  }

  onRemoveParticipant(pub) {
    if (confirm("Remove participant?")) {
      Session.channels[this.props.id].removeParticipant(pub);
    }
  }

  renderGroupSettings() {
    const chat = Session.channels[this.props.id];
    if (chat && chat.uuid) {
      return html`
        <div>
          <p>${tr('participants')}:</p>
          <div class="flex-table">
            ${
              chat ? Object.keys(chat.participantProfiles).map(k => {
                const profile = chat.participantProfiles[k];
                if (!(profile.permissions && profile.permissions.read && profile.permissions.write)) { return; }
                return html`
                  <div class="flex-row">
                    <div class="flex-cell">
                      <div class="profile-link-container">
                        <a class="profile-link" onClick=${() => route(`/profile/${  k}`)}>
                          <${Identicon} str=${k} width=40/>
                          <${Name} pub=${k}/>
                          ${profile.permissions && profile.permissions.admin ? html`
                            <small style="margin-left:5px">${tr('admin')}</small>
                          `: ''}
                        </a>
                      </div>
                    </div>
                    ${this.state.isAdmin ? html`
                      <div class="flex-cell no-flex">
                        <button onClick=${() => this.onRemoveParticipant(k)}>${tr('remove')}</button>
                      </div>
                    ` : ''}
                  </div>
                `;
              }) : ''
            }
          </div>
          ${this.state.isAdmin ? html`
            <div>
              <p>${tr('add_participant')}:</p>
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
            <p>${tr('invite_links')}</p>
            <div class="flex-table">
              ${Object.keys(chat.inviteLinks).map(id => {
                const url = chat.inviteLinks[id];
                if (!url) { return; }
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
                        <button onClick=${() => this.removeChatLink(id)}>${tr('remove')}</button>
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
    const editable = this.state.isAdmin;
    let profilePhoto;
    if (editable) {
      profilePhoto = html`<${ProfilePhotoPicker} currentPhoto=${this.state.photo} placeholder=${this.props.id} callback=${src => this.onProfilePhotoSet(src)}/>`;
    } else if (this.state.photo) {
        profilePhoto = html`<${SafeImg} class="profile-photo" src=${this.state.photo}/>`
      } else {
        profilePhoto = html`<${Identicon} str=${this.props.id} width=250/>`
      }
    return html`
      <div class="content">
        <div class="profile-top">
          <div class="profile-header">
            <div class="profile-photo-container">
              ${profilePhoto}
            </div>
            <div class="profile-header-stuff">
              <h3 class="profile-name" placeholder=${editable ? tr('name') : ''} contenteditable=${editable} onInput=${e => this.onNameInput(e)}>${this.state.name}</h3>
              <div class="profile-about hidden-xs">
                <p class="profile-about-content" placeholder=${editable ? tr('about') : ''} contenteditable=${editable} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
              </div>
              <div class="profile-actions">
                <button onClick=${() => route(`/chat/${  this.props.id}`)}>${tr('send_message')}</button>
                <button onClick=${() => $('#profile-page-qr').toggle()}>${tr('show_qr_code')}</button>
                <button class="show-settings" onClick=${() => this.onClickSettings()}>${tr('settings')}</button>
              </div>
            </div>
          </div>
          <div class="profile-about visible-xs-flex">
            <p class="profile-about-content" placeholder=${editable ? tr('about') : ''} contenteditable=${editable} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
          </div>

          ${this.renderGroupSettings()}

          <p id="profile-page-qr" style="display:none" class="qr-container"></p>
          <div id="chat-settings" style="display:none">
            <hr/>
            <h3>${tr('chat_settings')}</h3>
            <div class="notification-settings">
              <h4>${tr('notifications')}</h4>
              <input type="radio" id="notifyAll" name="notificationPreference" value="all"/>
              <label for="notifyAll">${tr('all_messages')}</label><br/>
              <input type="radio" id="notifyMentionsOnly" name="notificationPreference" value="mentions"/>
              <label for="notifyMentionsOnly">${tr('mentions_only')}</label><br/>
              <input type="radio" id="notifyNothing" name="notificationPreference" value="nothing"/>
              <label for="notifyNothing">${tr('nothing')}</label><br/>
            </div>
            <hr/>
            <p>
              <button class="delete-chat" onClick=${() => deleteChat(this.props.id)}>${tr('delete_chat')}</button>
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
  }

  componentDidMount() {
    const pub = this.props.id;
    this.eventListeners.forEach(e => e.off());
    this.setState({name: '', photo: '', about: ''});
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
    let qrCodeEl = $('#profile-page-qr');
    qrCodeEl.empty();
    State.local.get('inviteLinksChanged').on(() => this.setState({}));
    State.local.get('channels').get(this.props.id).get('participants').on(() => {
      const isAdmin = areWeAdmin(pub);
      this.setState({isAdmin});
    });
    if (chat) {
      this.groupDidMount();
      $(`input[name=notificationPreference][value=${  chat.notificationSetting  }]`).attr('checked', 'checked');
      $('input:radio[name=notificationPreference]').off().on('change', (event) => {
        chat.put('notificationSetting', event.target.value);
      });
    }
    qrCodeEl.empty();
    new QRCode(qrCodeEl[0], {
      text: `https://iris.to/${  window.location.pathname}`,
      width: 300,
      height: 300,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  }
}

function areWeAdmin(uuid) {
  const me = Session.channels[uuid] && Session.channels[uuid].participantProfiles[Session.getKey().pub];
  return !!(me && me.permissions && me.permissions.admin);
}

export default Group;
