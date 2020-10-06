import { Component } from '../lib/preact.js';
import {html} from '../Helpers.js';
import {translate as t} from '../Translation.js';
import {newChat} from '../Chat.js';
import {publicState} from '../Main.js';

class FollowButton extends Component {
  constructor() {
    super();
    this.eventListeners = {};
  }

  onClick(e) {
    e.preventDefault();
    const follow = !this.state.following;
    publicState.user().get('follow').get(this.props.id).put(follow);
    if (follow) {
      newChat(this.props.id);
    }
  }

  componentDidMount() {
    publicState.user().get('follow').get(this.props.id).on((following, a, b, e) => {
      this.setState({following});
      this.eventListeners['follow'] = e;
    });
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  render() {
    return html`
      <button class="follow ${this.state.following ? 'following' : ''}" onClick=${e => this.onClick(e)}>
        <span class="nonhover">${this.state.following ? t('following') : t('follow')}</span>
        <span class="hover">${t('unfollow')}</span>
      </button>
    `;
  }
}

export default FollowButton;
