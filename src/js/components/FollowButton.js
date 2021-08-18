import Component from '../BaseComponent';
import { html } from 'htm/preact';
import {translate as t} from '../Translation.js';
import Session from '../Session.js';
import State from '../State.js';

class FollowButton extends Component {
  constructor() {
    super();
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
    State.public.user().get(this.key).get(this.props.id).on(this.sub(
      value => {
        const s = {};
        s[this.key] = value;
        this.setState(s);
      }
    ));
  }

  render() {
    let nonhoverText;
    if (this.state[this.key]) {
      nonhoverText = this.actionDone || t(this.key);
    } else {
      nonhoverText = this.action || t(this.activeClass);
    }
    return html`
      <button class="${this.cls || this.key} ${this.state[this.key] ? this.activeClass : ''}" onClick=${e => this.onClick(e)}>
        <span class="nonhover">${nonhoverText}</span>
        <span class="hover">${t(this.hoverAction)}</span>
      </button>
    `;
  }
}

export default FollowButton;
