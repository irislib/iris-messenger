import Component from '../BaseComponent';
import { html } from 'htm/preact';
import {translate as t} from '../Translation.js';
import Session from '../Session.js';
import State from '../State.js';
import Notifications from '../Notifications';

class FollowButton extends Component {
  constructor() {
    super();
    this.key = 'follow';
    this.actionDone = 'following';
    this.action = 'follow';
    this.activeClass = 'following';
    this.hoverAction = 'unfollow';
  }

  onClick(e) {
    e.preventDefault();
    const value = !this.state[this.key];
    if (value && this.key === 'follow') {
      Session.newChannel(this.props.id);
      State.public.user().get('block').get(this.props.id).put(false);
      Notifications.sendIrisNotification(this.props.id, {event:'follow'});
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
    return html`
      <button class="${this.cls || this.key} ${this.state[this.key] ? this.activeClass : ''}" onClick=${e => this.onClick(e)}>
        <span class="nonhover">${t(this.state[this.key] ? this.actionDone : this.action)}</span>
        <span class="hover">${t(this.hoverAction)}</span>
      </button>
    `;
  }
}

export default FollowButton;
