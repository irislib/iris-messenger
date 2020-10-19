import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {localState, publicState} from '../Main.js';
import Identicon from './Identicon.js';
import {translate as t} from '../Translation.js';
import FollowButton from './FollowButton.js';
import Name from './Name.js';

class FollowsView extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.follows = {};
  }

  getFollows() {
    publicState.user(this.props.id).get('follow').map().on((follows, pub, b, e) => {
      this.eventListeners['follow'] = e;
      if (follows) {
        this.follows[pub] = {};
        this.setState({});
      } else {
        delete this.follows[pub];
        this.eventListeners[pub] && this.eventListeners[pub].off();
      }
      this.setState({});
    });
  }

  getFollowers() {
    localState.get('follows').map().once((follows, pub) => {
      if (follows) {
        publicState.user(pub).get('follow').get(this.props.id).on(follows => {
          if (!follows) return;
          this.follows[pub] = {};
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

  render() {
    const keys = Object.keys(this.follows);
    return html`
      <div class="main-view" id="follows-view">
        <div class="centered-container">
          <h3><a href="/profile/${this.props.id}"><${Name} pub=${this.props.id} placeholder="—" /></a>:<i> </i>
          ${this.props.followers ? t('known_followers') : t('following')}</h3>
          <div id="follows-list">
            ${keys.map(k => {
              return html`
              <div class="profile-link-container">
                <a href="/profile/${k}" class="profile-link">
                  <${Identicon} str=${k} width=49/>
                  <${Name} pub=${k}/>
                </a>
                <${FollowButton} id=${k}/>
              </div>`;
            })}
            ${keys.length === 0 ? '—' : ''}
          </div>
        </div>
      </div>
    `;
  }
}

export default FollowsView;
