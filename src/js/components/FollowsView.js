import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {publicState} from '../Main.js';
import Identicon from './Identicon.js';
import {translate as t} from '../Translation.js';

class FollowsView extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.follows = {};
  }

  componentDidMount() {
    if (this.props.id) {
      publicState.user(this.props.id).get('profile').get('name').on((name, a, b, e) => {
        this.eventListeners['name'] = e;
        this.setState({name});
      })

      publicState.user(this.props.id).get('follow').map().on((follows, pub, b, e) => {
        this.eventListeners['follow'] = e;
        if (follows) {
          this.follows[pub] = {};
          publicState.user(pub).get('profile').get('name').on((name, a, b, e) => {
            this.eventListeners[pub] = e;
            this.follows[pub].name = name;
            this.setState({});
          });
        } else {
          delete this.follows[pub];
          this.eventListeners[pub] && this.eventListeners[pub].off();
        }
        this.setState({});
      });
    }
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  render() {
    const keys = Object.keys(this.follows);
    return html`
      <div class="main-view public-messages-view" id="follows-view">
        <div class="centered-container">
          <h3><a href="/profile/${this.props.id}">${this.state.name || '—'}</a> ${t('following')}</h3>
          <div id="follows-list">
            ${keys.map(k => {
              return html`
              <div>
                <a href="/profile/${k}"><${Identicon} str=${k} width=49/> ${this.follows[k].name || ''}</a>
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
