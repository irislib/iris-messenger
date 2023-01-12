import iris from 'iris-lib';

import Component from '../BaseComponent';
import Nostr from '../Nostr';
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
    this.actionDone = 'following';
    this.action = 'follow';
    this.activeClass = 'following';
    this.hoverAction = 'unfollow';
  }

  onClick(e) {
    e.preventDefault();
    const newValue = !this.state[this.key];
    if (this.key === 'follow') {
      const nostrAddr = Nostr.toNostrHexAddress(this.props.id);
      if (nostrAddr) {
        Nostr.follow(nostrAddr, newValue); // follow or unfollow
      }
      iris.public().get('block').get(this.props.id).put(false);
      return;
    }
    if (newValue && this.key === 'block') {
      // TODO unfollow on nostr
      //iris.public().get('follow').get(this.props.id).put(false);
    }
    iris.public().get(this.key).get(this.props.id).put(newValue);
    iris.public().get(this.key).get(this.props.id).put(newValue);
  }

  componentDidMount() {
    if (this.key === 'follow') {
      Nostr.getFollowedByUser(iris.session.getKey().secp256k1.rpub, (follows) => {
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
