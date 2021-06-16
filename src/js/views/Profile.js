import { html } from '../Helpers.js';
import {translate as t} from '../Translation.js';
import State from '../State.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import PublicMessageForm from '../components/PublicMessageForm.js';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker.js';
import { route } from '../lib/preact-router.es.js';
import SafeImg from '../components/SafeImg.js';
import CopyButton from '../components/CopyButton.js';
import FollowButton from '../components/FollowButton.js';
import BlockButton from '../components/BlockButton.js';
import MessageFeed from '../components/MessageFeed.js';
import Identicon from '../components/Identicon.js';
import View from './View.js';
import { Link } from '../lib/preact.match.js';

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
    State.public.user().get('profile').get('photo').put(src);
  }

  onAboutInput(e) {
    const about = $(e.target).text().trim();
    State.public.user().get('profile').get('about').put(about);
  }

  onClickSettings() {
    $('#chat-settings').toggle();
  }

  onNameInput(e) {
    const name = $(e.target).text().trim();
    if (name.length) {
      State.public.user().get('profile').get('name').put(name);
    }
  }

  getNotification() {
    if (this.state.noFollowers && this.followers.has(Session.getPubKey())) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>Share your profile link so ${this.state.name || 'this user'} can follow you:</p>
            <p><${CopyButton} text=${t('copy_link')} title=${Session.getMyName()} copyStr=${Helpers.getProfileLink(Session.getPubKey())}/></p>
            <small>${t('visibility')}</small>
          </div>
        </div>
      `;
    }
  }

  renderSettings() {
    const chat = Session.channels[this.props.id];

    return html`
    <div id="chat-settings" style="display:none">
      <hr/>
      <h3>${t('chat_settings')}</h3>
      <div class="profile-nicknames">
        <h4>${t('nicknames')}</h4>
        <p>
          ${t('nickname')}:
          <input value=${chat && chat.theirNickname} onInput=${e => chat && chat.put('nickname', e.target.value)}/>
        </p>
        <p>
          ${t('their_nickname_for_you')}:
          <span>
            ${chat && chat.myNickname && chat.myNickname.length ? chat.myNickname : ''}
          </span>
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
      </p>
      <hr/>
    </div>
    `;
  }

  renderDetails() {
    this.isMyProfile = Session.getPubKey() === this.props.id;
    let profilePhoto;
    if (this.isMyProfile) {
      profilePhoto = html`<${ProfilePhotoPicker} currentPhoto=${this.state.photo} placeholder=${this.props.id} callback=${src => this.onProfilePhotoSet(src)}/>`;
    } else {
      if (this.state.photo) {
        profilePhoto = html`<${SafeImg} class="profile-photo" src=${this.state.photo}/>`
      } else {
        profilePhoto = html`<${Identicon} str=${this.props.id} width=250/>`
      }
    }
    return html`
    <div class="profile-top">
      <div class="profile-header">
        <div class="profile-photo-container">
          ${profilePhoto}
        </div>
        <div class="profile-header-stuff">
          <h3 class="profile-name" placeholder=${this.isMyProfile ? t('name') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onNameInput(e)}>${this.state.name}</h3>
          <div class="profile-about hidden-xs">
            <p class="profile-about-content" placeholder=${this.isMyProfile ? t('about') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
          </div>
          <div class="profile-actions">
            <div class="follow-count">
              <a href="/follows/${this.props.id}">
                <span>${this.state.followedUserCount}</span> ${t('following')}
              </a>
              <a href="/followers/${this.props.id}">
                <span>${this.state.followerCount}</span> ${t('followers')}
              </a>
            </div>
            ${this.followedUsers.has(Session.getPubKey()) ? html`
              <p><small>${t('follows_you')}</small></p>
            `: this.props.id === SMS_VERIFIER_PUB ? html`
              <p><a href="https://iris-sms-auth.herokuapp.com/?pub=${Session.getPubKey()}">${t('ask_for_verification')}</a></p>
            ` : ''}
            ${this.isMyProfile ? '' : html`<${FollowButton} id=${this.props.id}/>`}
            <button onClick=${() => route('/chat/' + this.props.id)}>${t('send_message')}</button>
            <${CopyButton} text=${t('copy_link')} title=${this.state.name} copyStr=${'https://iris.to' + window.location.pathname}/>
            <button onClick=${() => $('#profile-page-qr').toggle()}>${t('show_qr_code')}</button>
            ${this.isMyProfile ? '' : html`
              <button class="show-settings" onClick=${() => this.onClickSettings()}>${t('settings')}</button>
            `}
            ${this.isMyProfile ? '' : html`<${BlockButton} id=${this.props.id}/>`}
          </div>
        </div>
      </div>
      <div class="profile-about visible-xs-flex">
        <p class="profile-about-content" placeholder=${this.isMyProfile ? t('about') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
      </div>

      <p id="profile-page-qr" style="display:none" class="qr-container"></p>
      ${this.renderSettings()}
    </div>
    `;
  }

  renderTabs() {
    return html`
    <div class="tabs">
      <${Link} activeClassName="active" href="/profile/${this.props.id}">${t('posts')}<//>
      <${Link} activeClassName="active" href="/replies/${this.props.id}">${t('replies')}<//>
      <${Link} activeClassName="active" href="/likes/${this.props.id}">${t('likes')}<//>
      <${Link} activeClassName="active" href="/media/${this.props.id}">Media<//>
    </div>
    `;
  }

  renderTab() {
    if (this.props.tab === 'replies') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed} key="replies${this.props.id}" node=${State.public.user(this.props.id).get('replies')} keyIsMsgHash=${true} />
        </div>
      `;
    } else if (this.props.tab === 'likes') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed} key="likes${this.props.id}" node=${State.public.user(this.props.id).get('likes')} keyIsMsgHash=${true}/>
        </div>
      `;
    } else if (this.props.tab === 'media') {
      return html`
        <div class="public-messages-view">
          ${this.isMyProfile ? html`<${PublicMessageForm} index="media" class="hidden-xs" autofocus=${false}/>` : ''}
          <${MessageFeed} key="media${this.props.id}" node=${State.public.user(this.props.id).get('media')}/>
        </div>
      `;
    } else {
      const messageForm = this.isMyProfile ? html`<${PublicMessageForm} class="hidden-xs" autofocus=${false}/>` : '';
      return html`
      <div>
        ${messageForm}
        <div class="public-messages-view">
          ${this.getNotification()}
          <${MessageFeed} key="posts${this.props.id}" node=${State.public.user(this.props.id).get('msgs')} />
        </div>
      </div>
      `;
    }
  }

  renderView() {
    return html`
      <div class="content">
        ${this.renderDetails()}
        ${this.renderTabs()}
        ${this.renderTab()}
      </div>
    `;
  }

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.setState({memberCandidate:null});
      this.componentDidMount();
    }
  }

  getProfileDetails() {
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

  componentDidMount() {
    const pub = this.props.id;
    this.eventListeners.forEach(e => e.off());
    this.setState({followedUserCount: 0, followerCount: 0, name: '', photo: '', about: ''});
    this.isMyProfile = Session.getPubKey() === pub;
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
    this.getProfileDetails();
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

export default Profile;
