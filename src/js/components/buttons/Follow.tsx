import Component from '../../BaseComponent';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation';

import { Button } from './Button';

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
  }

  onClick(e) {
    e.preventDefault();
    const newValue = !this.state[this.key];
    if (this.key === 'follow') {
      SocialNetwork.setFollowed(Key.toNostrHexAddress(this.props.id), newValue);
      return;
    }
    if (this.key === 'block') {
      SocialNetwork.setBlocked(Key.toNostrHexAddress(this.props.id), newValue);
    }
  }

  componentDidMount() {
    if (this.key === 'follow') {
      SocialNetwork.getFollowedByUser(Key.getPubKey(), (follows) => {
        const follow = follows?.has(Key.toNostrHexAddress(this.props.id));
        this.setState({ follow });
      });
      return;
    }
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

export default Follow;
