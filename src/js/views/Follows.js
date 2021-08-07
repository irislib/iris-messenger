import { html } from 'htm/preact';
import State from '../State.js';
import Identicon from '../components/Identicon.js';
import {translate as t} from '../Translation.js';
import FollowButton from '../components/FollowButton.js';
import Name from '../components/Name.js';
import View from './View.js';
import Session from '../Session.js';

class Follows extends View {
  constructor() {
    super();
    this.eventListeners = {};
    this.follows = {};
    this.id = "follows-view";
  }

  getFollows() {
    const f = Session.getFollows();
    State.public.user(this.props.id).get('follow').map().on((follows, pub, b, e) => {
      this.eventListeners['follow'] = e;
      if (follows) {
        this.follows[pub] = f[pub] || {};
        this.setState({});
      } else {
        delete this.follows[pub];
        this.eventListeners[pub] && this.eventListeners[pub].off();
      }
      this.setState({});
    });
  }

  getFollowers() {
    const f = Session.getFollows();
    State.local.get('groups').get('follows').map().once((follows, pub) => {
      if (follows) {
        State.public.user(pub).get('follow').get(this.props.id).on(follows => {
          if (!follows) return;
          this.follows[pub] = f[pub] || {};
          this.setState({});
        })
      }
    });
  }

  componentDidMount() {
    if (this.props.id) {
      this.props.followers ? this.getFollowers() : this.getFollows();
    }
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  renderView() {
    const keys = Object.keys(this.follows);
    keys.sort((a,b) => {
      const aF = this.follows[a].followers && this.follows[a].followers.size || 0;
      const bF = this.follows[b].followers && this.follows[b].followers.size || 0;
      return bF - aF;
    });
    return html`
      <div class="centered-container">
        <h3><a href="/profile/${this.props.id}"><${Name} pub=${this.props.id} placeholder="—" /></a>:<i> </i>
        ${this.props.followers ? t('followers') : t('following')}</h3>
        <div id="follows-list">
          ${keys.map(k => {
            return html`
            <div class="profile-link-container">
              <a href="/profile/${k}" class="profile-link">
                <${Identicon} str=${k} width=49/>
                <div>
                  <${Name} pub=${k}/><br/>
                  <small class="follower-count">${this.follows[k].followers && this.follows[k].followers.size || '0'} followers</small>
                </div>
              </a>
              ${k !== Session.getPubKey() ? html`<${FollowButton} id=${k}/>` : ''}
            </div>`;
          })}
          ${keys.length === 0 ? '—' : ''}
        </div>
      </div>
    `;
  }
}

export default Follows;
