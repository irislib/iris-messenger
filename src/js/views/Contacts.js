import { html } from '../Helpers.js';
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
    this.eventListeners = {};
    this.contacts = {};
    this.id = "contacts-view";
  }

  getContacts() {
    const f = Session.getFollows();
    State.local.get('follows').map().on((contacts, pub, b, e) => {
      if (pub === Session.getPubKey()) { return; }
      this.eventListeners['follow'] = e;
      if (contacts) {
        this.contacts[pub] = f[pub] || {};
        this.setState({});
      } else {
        delete this.contacts[pub];
        this.eventListeners[pub] && this.eventListeners[pub].off();
      }
      this.setState({});
    });
  }

  componentDidMount() {
    this.getContacts();
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  renderView() {
    const keys = Object.keys(this.contacts);
    keys.sort((a,b) => {
      const aF = this.contacts[a].followers && this.contacts[a].followers.size || 0;
      const bF = this.contacts[b].followers && this.contacts[b].followers.size || 0;
      return bF - aF;
    });
    return html`
      <div class="centered-container">
        <div id="contacts-list">
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
