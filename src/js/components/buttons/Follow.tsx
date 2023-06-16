import Component from '../../BaseComponent';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';

type Props = {
  id: string;
};

class Follow extends Component<Props> {
  key: string;
  cls?: string;
  actionDone: string;
  action: string;
  activeClass: string;
  hoverAction: string;

  constructor() {
    super();
    this.key = 'follow';
    this.activeClass = 'following';
    this.action = t('follow_btn');
    this.actionDone = t('following_btn');
    this.hoverAction = t('unfollow_btn');
    this.state = { ...this.state, hover: false };
  }

  handleMouseEnter = () => {
    this.setState({ hover: true });
  };

  handleMouseLeave = () => {
    this.setState({ hover: false });
  };

  onClick(e) {
    e.preventDefault();
    const newValue = !this.state[this.key];
    const hex = Key.toNostrHexAddress(this.props.id);
    if (!hex) return;
    if (this.key === 'follow') {
      SocialNetwork.setFollowed(hex, newValue);
      return;
    }
    if (this.key === 'block') {
      SocialNetwork.setBlocked(hex, newValue);
    }
  }

  componentDidMount() {
    if (this.key === 'follow') {
      SocialNetwork.getFollowedByUser(Key.getPubKey(), (follows) => {
        const hex = Key.toNostrHexAddress(this.props.id);
        const follow = hex && follows?.has(hex);
        this.setState({ follow });
      });
      return;
    }
  }

  render() {
    const isFollowed = this.state[this.key];
    const isHovering = this.state.hover;

    let buttonText;

    if (isFollowed && isHovering) {
      buttonText = this.hoverAction;
    } else if (isFollowed && !isHovering) {
      buttonText = this.actionDone;
    } else {
      buttonText = this.action;
    }

    return (
      <button
        className={`btn btn-sm btn-neutral ${this.cls || this.key} ${
          isFollowed ? this.activeClass : ''
        }`}
        onClick={(e) => this.onClick(e)}
        onMouseEnter={this.handleMouseEnter} // handle hover state
        onMouseLeave={this.handleMouseLeave} // handle hover state
      >
        {t(buttonText)}
      </button>
    );
  }
}

export default Follow;
