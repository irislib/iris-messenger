import iris from 'iris-lib';

import Component from '../BaseComponent';
import Nostr from '../nostr/Nostr';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation';

import Button from './basic/Button';

type Props = {
  id: string;
};

class FollowButton extends Component<Props> {
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
  }

  onClick(e) {
    e.preventDefault();
    const newValue = !this.state[this.key];
    if (this.key === 'follow') {
      SocialNetwork.setFollowed(Nostr.toNostrHexAddress(this.props.id), newValue);
      return;
    }
    if (this.key === 'block') {
      SocialNetwork.setBlocked(Nostr.toNostrHexAddress(this.props.id), newValue);
    }
  }

  componentDidMount() {
    if (this.key === 'follow') {
      SocialNetwork.getFollowedByUser(Key.getPubKey(), (follows) => {
        const follow = follows?.has(Nostr.toNostrHexAddress(this.props.id));
        this.setState({ follow });
      });
      return;
    }
    iris
      .public()
      .get(this.key)
      .get(this.props.id)
      .on(
        this.sub((value) => {
          const s = {};
          s[this.key] = value;
          this.setState(s);
        }),
      );
  }

  render() {
    return (
      <Button
        className={`${this.cls || this.key} ${this.state[this.key] ? this.activeClass : ''}`}
        onClick={(e) => this.onClick(e)}
      >
        <span className="nonhover">{t(this.state[this.key] ? this.actionDone : this.action)}</span>
        <span className="hover">{t(this.hoverAction)}</span>
      </Button>
    );
  }
}

export default FollowButton;
