import { html } from 'htm/preact';
import State from '../State';
import Identicon from '../components/Identicon';
import {translate as t} from '../Translation';
import FollowButton from '../components/FollowButton';
import Name from '../components/Name';
import View from './View';
import Session from '../Session';

class Follows extends View {
  constructor() {
    super();
    this.follows = {};
    this.id = "follows-view";
  }

  getFollows() {
    const f = Session.getFollows();
    State.public.user(this.props.id).get('follow').map().on(this.sub(
      (follows, pub) => {
        if (follows) {
          this.follows[pub] = f[pub] || {};
          this.setState({});
        } else {
          delete this.follows[pub];
        }
        this.setState({});
      }
    ));
  }

  shouldComponentUpdate() {
    return true;
  }

  getFollowers() {
    const f = Session.getFollows();
    console.log(`follow/${this.props.id}`);
    State.group().on(`follow/${this.props.id}`, this.sub((following, a, b, e, user) => {
      console.log(user, following);
      if (following) {
          if (!following) return;
          console.log(f);
          this.follows[user] = f[user] || {};
          this.setState({});
      }
    }));
  }

  componentDidMount() {
    if (this.props.id) {
      this.props.followers ? this.getFollowers() : this.getFollows();
    }
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
            <div key=${k} class="profile-link-container">
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
