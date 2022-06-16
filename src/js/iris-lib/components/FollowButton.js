import {Component} from 'preact';
import util from '../util';
import {html} from 'htm/preact';
import Key from '../Key';
import register from 'preact-custom-element';

class FollowButton extends Component {
  constructor() {
    super();
    this.eventListeners = {};
  }

  onClick(e) {
    e.preventDefault();
    const follow = !this.state.following;
    util.getPublicState().user().get('follow').get(this.props.user).put(follow);
  }

  componentDidMount() {
    util.injectCss();
    Key.getDefault().then(key => {
      util.getPublicState().user().auth(key);
      util.getPublicState().user().get('follow').get(this.props.user).on((following, a, b, e) => {
        this.setState({following});
        this.eventListeners['follow'] = e;
      });
    });
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  render() {
    return html`
      <button class="iris-follow-button ${this.state.following ? 'following' : ''} ${this.props['inner-class'] || ''}" onClick=${e => this.onClick(e)}>
        <span class="nonhover">${this.state.following ? 'Following' : 'Follow'}</span>
        <span class="hover">Unfollow</span>
      </button>
    `;
  }
}

!util.isNode && register(FollowButton, 'iris-follow-button', ['user']);

export default FollowButton;
