import Helpers from '../Helpers.js';
import { html } from 'htm/preact';
import {translate as t} from '../Translation.js';
import State from '../State.js';
import Session from '../Session.js';
import PublicMessageForm from '../components/PublicMessageForm.js';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker.js';
import { route } from 'preact-router';
import { createRef } from 'preact';
import SafeImg from '../components/SafeImg.js';
import CopyButton from '../components/CopyButton.js';
import FollowButton from '../components/FollowButton.js';
import BlockButton from '../components/BlockButton.js';
import MessageFeed from '../components/MessageFeed.js';
import Identicon from '../components/Identicon.js';
import View from './View.js';
import { Link } from 'preact-router/match';
import $ from 'jquery';
import QRCode from '../lib/qrcode.min.js';
import iris from 'iris-lib';
import {Helmet} from "react-helmet";

const SMS_VERIFIER_PUB = 'ysavwX9TVnlDw93w9IxezCJqSDMyzIU-qpD8VTN5yko.3ll1dFdxLkgyVpejFkEMOFkQzp_tRrkT3fImZEx94Co';

function deleteChat(pub) {
  iris.Channel.deleteChannel(State.public, Session.getKey(), pub);
  delete Session.channels[pub];
  State.local.get('channels').get(pub).put(null);
}

class Profile extends View {
  constructor() {
    super();
    this.followedUsers = new Set();
    this.followers = new Set();
    this.id = "profile";
    this.qrRef = createRef();
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
    } else if (this.state.photo && !this.state.blocked) {
        profilePhoto = html`<${SafeImg} class="profile-photo" src=${this.state.photo}/>`
      } else {
        profilePhoto = html`<${Identicon} str=${this.props.id} hidePhoto=${this.state.blocked} width=250/>`
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
            ${this.isMyProfile ? '' : html`<${FollowButton} key=${`${this.props.id}follow`} id=${this.props.id}/>`}
            <button onClick=${() => route(`/chat/${  this.props.id}`)}>${t('send_message')}</button>
            <${CopyButton} key=${`${this.props.id}copy`} text=${t('copy_link')} title=${this.state.name} copyStr=${`https://iris.to${  window.location.pathname}`}/>
            <button onClick=${() => $(this.qrRef.current).toggle()}>${t('show_qr_code')}</button>
            ${this.isMyProfile ? '' : html`
              <button class="show-settings" onClick=${() => this.onClickSettings()}>${t('settings')}</button>
            `}
            ${this.isMyProfile ? '' : html`<${BlockButton} key=${`${this.props.id}block`} id=${this.props.id}/>`}
          </div>
        </div>
      </div>
      <div class="profile-about visible-xs-flex">
        <p class="profile-about-content" placeholder=${this.isMyProfile ? t('about') : ''} contenteditable=${this.isMyProfile} onInput=${e => this.onAboutInput(e)}>${this.state.about}</p>
      </div>

      <p ref=${this.qrRef} style="display:none" class="qr-container"></p>
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
      <${Link} activeClassName="active" href="/media/${this.props.id}">${t('media')}<//>
    </div>
    `;
  }

  renderTab() {
    if (this.props.tab === 'replies') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed} scrollElement=${this.scrollElement.current} key="replies${this.props.id}" node=${State.public.user(this.props.id).get('replies')} keyIsMsgHash=${true} />
        </div>
      `;
    } else if (this.props.tab === 'likes') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed} scrollElement=${this.scrollElement.current} key="likes${this.props.id}" node=${State.public.user(this.props.id).get('likes')} keyIsMsgHash=${true}/>
        </div>
      `;
    } else if (this.props.tab === 'media') {
      return html`
        <div class="public-messages-view">
          ${this.isMyProfile ? html`<${PublicMessageForm} index="media" class="hidden-xs" autofocus=${false}/>` : ''}
          <${MessageFeed} scrollElement=${this.scrollElement.current} key="media${this.props.id}" node=${State.public.user(this.props.id).get('media')}/>
        </div>
      `;
    }
      const messageForm = this.isMyProfile ? html`<${PublicMessageForm} class="hidden-xs" autofocus=${false}/>` : '';
      return html`
      <div>
        ${messageForm}
        <div class="public-messages-view">
          ${this.getNotification()}
          <${MessageFeed} scrollElement=${this.scrollElement.current} key="posts${this.props.id}" node=${State.public.user(this.props.id).get('msgs')} />
        </div>
      </div>
      `;

  }

  renderView() {
    const title = this.state.name || 'Profile';
    const ogTitle = `${title} | Iris`;
    const description = `Latest posts by ${this.state.name || 'user'}. ${this.state.about || ''}`;
    return html`
      <div class="content">
        <${Helmet}>
            <title>${title}</title>
            <meta name="description" content=${description} />
            <meta property="og:type" content="profile" />
            ${this.state.ogImageUrl ? html`<meta property="og:image" content=${this.state.ogImageUrl} />` : ''}
            <meta property="og:title" content=${ogTitle} />
            <meta property="og:description" content=${description} />
        <//>
        ${this.renderDetails()}
        ${this.state.blocked ? '' : this.renderTabs()}
        ${this.state.blocked ? '' : this.renderTab()}
      </div>
    `;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.componentDidMount();
    }
  }

  getProfileDetails() {
    const pub = this.props.id;
    State.public.user(pub).get('follow').map().on(this.sub(
      (following,key) => {
        if (following) {
          this.followedUsers.add(key);
        } else {
          this.followedUsers.delete(key);
        }
        this.setState({followedUserCount: this.followedUsers.size});
      }
    ));
    State.group().on(`follow/${pub}`, this.sub((following, a, b, e, user) => {
      if (following) {
        this.followers.add(user);
        this.setState({followerCount: this.followers.size});
      }
    }));
    State.public.user(pub).get('profile').get('name').on(this.sub(
      name => {
        if (!$('#profile .profile-name:focus').length) {
          this.setState({name});
        }
      }
    ));
    State.public.user(pub).get('profile').get('photo').on(this.sub(photo => {
      this.setState({photo});
      this.setOgImageUrl(photo);
    }));
    State.public.user(pub).get('profile').get('about').on(this.sub(
      about => {
        if (!$('#profile .profile-about-content:focus').length) {
          this.setState({about});
        } else {
          $('#profile .profile-about-content:not(:focus)').text(about);
        }
      }
    ));
  }

  componentDidMount() {
    const pub = this.props.id;
    this.followedUsers = new Set();
    this.followers = new Set();
    this.setState({followedUserCount: 0, followerCount: 0, name: '', photo: '', about: '', blocked: false});
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
    let qrCodeEl = $(this.qrRef.current);
    qrCodeEl.empty();
    State.local.get('noFollowers').on(noFollowers => this.setState({noFollowers}));
    this.getProfileDetails();
    if (chat) {
      $(`input[name=notificationPreference][value=${  chat.notificationSetting  }]`).attr('checked', 'checked');
      $('input:radio[name=notificationPreference]').off().on('change', (event) => {
        chat.put('notificationSetting', event.target.value);
      });
    }
    qrCodeEl.empty();
    new QRCode(qrCodeEl.get(0), {
      text: `https://iris.to/${  window.location.pathname}`,
      width: 300,
      height: 300,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
    State.public.user().get('block').get(this.props.id).on(this.sub(
      blocked => {
        this.setState({blocked});
      }
    ))
  }
}

export default Profile;
