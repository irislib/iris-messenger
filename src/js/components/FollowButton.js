import { Component } from 'preact';
import {html} from '../Helpers.js';
import {translate as t} from '../Translation.js';
import Session from '../Session.js';
import State from '../State.js';

class FollowButton extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.key = 'follow';
    this.activeClass = 'following';
    this.hoverAction = 'unfollow';
  }

  onClick(e) {
    e.preventDefault();
    const value = !this.state[this.key];
    if (value && this.key === 'follow') {
      Session.newChannel(this.props.id);
      State.public.user().get('block').get(this.props.id).put(false);
    }
    if (value && this.key === 'block') {
      State.public.user().get('follow').get(this.props.id).put(false);
    }
    State.public.user().get(this.key).get(this.props.id).put(value);
  }

  componentDidMount() {
    State.public.user().get(this.key).get(this.props.id).on((value, a, b, e) => {
      const s = {};
      s[this.key] = value;
      this.setState(s);
      this.eventListeners[this.key] = e;
    });
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  render() {
    return html`
      <button class="${this.key} ${this.state[this.key] ? this.activeClass : ''}" onClick=${e => this.onClick(e)}>
        <span class="nonhover">${this.state[this.key] ? t(this.activeClass) : t(this.key)}</span>
        <span class="hover">${t(this.hoverAction)}</span>
      </button>
    `;
  }
}

export default FollowButton;
