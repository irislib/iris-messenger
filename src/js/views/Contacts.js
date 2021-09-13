import { html } from 'htm/preact';
import State from '../State.js';
import Identicon from '../components/Identicon.js';
import {translate as t} from '../Translation.js';
import FollowButton from '../components/FollowButton.js';
import Name from '../components/Name.js';
import View from './View.js';
import Session from '../Session.js';
import ScrollViewport from 'preact-scroll-viewport';

class Contacts extends View {
  constructor() {
    super();
    this.contacts = {};
    this.id = "contacts-view";
  }

  shouldComponentUpdate() {
    return true;
  }

  componentDidMount() {
    const f = Session.getFollows();
    State.local.get('groups').get('everyone').map().on(this.sub(
      (isContact, pub) => {
        if (pub === Session.getPubKey()) { return; }
        if (isContact) {
          this.contacts[pub] = f[pub] || {};
          this.setState({});
        } else {
          delete this.contacts[pub];
        }
        this.setState({});
      }
    ));
    State.electron && State.electron.get('bonjour').on(s => {
      const nearbyUsers = JSON.parse(s);
      console.log('nearbyUsers', nearbyUsers);
      this.setState({nearbyUsers});
    });
  }

  renderNearbyUsers() {
    return this.state.nearbyUsers.map(peer => {
      const k = peer.txt && peer.txt.user;
      if (!k) { return html`<p>${peer.name}</p>`; }
      return html`
        <div class="profile-link-container">
          ${k ? html`
            <div class="">
              <a href="/profile/${k}" class="profile-link">
                <${Identicon} key="i${k}" str=${k} width=49/>
                <div>
                  <${Name} key="k${k}" pub=${k}/><br/>
                  <small class="follower-count">
                      ${peer.name}<br/>
                      ${this.contacts[k] && this.contacts[k].followers && this.contacts[k].followers.size || '0'} ${t('followers')}
                  </small>
                </div>
              </a>
              ${k !== Session.getPubKey() ? html`<${FollowButton} key="f${k}" id=${k}/>` : ''}
            </div>
          `:''}
        </div>
      `;
    });
  }

  renderView() {
    const keys = Object.keys(this.contacts);
    if (keys.length === 0) {
      return html`
      <div class="centered-container">
        ${t('no_contacts_in_list')}
      </div>
      `
    }
    keys.sort((a,b) => {
      const aF = this.contacts[a].followers && this.contacts[a].followers.size || 0;
      const bF = this.contacts[b].followers && this.contacts[b].followers.size || 0;
      return bF - aF;
    });
    return html`
      <div class="centered-container">
        <div id="contacts-list">
          ${this.state.nearbyUsers && this.state.nearbyUsers.length ? html`
            <h3>Nearby users</h3>
            ${this.renderNearbyUsers()}
            <hr/><br/>
          `:''}
          <${ScrollViewport}>
            ${keys.map(k => {
              return html`
              <div class="profile-link-container">
                <a href="/profile/${k}" class="profile-link">
                  <${Identicon} key="i${k}" str=${k} width=49/>
                  <div>
                    <${Name} key="k${k}" pub=${k}/><br/>
                    <small class="follower-count">${this.contacts[k].followers && this.contacts[k].followers.size || '0'} ${t('followers')}</small>
                  </div>
                </a>
                ${k !== Session.getPubKey() ? html`<${FollowButton} key="f${k}" id=${k}/>` : ''}
              </div>`;
            })}
          </${ScrollViewport}>
          ${keys.length === 0 ? '—' : ''}
        </div>
      </div>
    `;
  }
}

export default Contacts;
