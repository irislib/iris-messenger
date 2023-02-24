import Component from '../BaseComponent';
import Nostr from '../nostr/Nostr';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation';

import Button from './basic/Button';
import Name from './Name';

type Props = {
  id: string;
  showName?: boolean;
};

class BlockButton extends Component<Props> {
  key: string;
  cls?: string;
  actionDone: string;
  action: string;
  activeClass: string;
  hoverAction: string;

  constructor() {
    super();
    this.cls = 'block';
    this.key = 'blocked';
    this.activeClass = 'blocked';
    this.action = t('block');
    this.actionDone = t('blocked');
    this.hoverAction = t('unblock');
  }

  onClick(e) {
    e.preventDefault();
    const newValue = !this.state[this.key];
    SocialNetwork.block(Nostr.toNostrHexAddress(this.props.id), newValue);
  }

  componentDidMount() {
    SocialNetwork.getBlockedUsers((blocks) => {
      const blocked = blocks?.has(Nostr.toNostrHexAddress(this.props.id));
      this.setState({ blocked });
    });
  }

  render() {
    return (
      <Button
        className={`${this.cls || this.key} ${this.state[this.key] ? this.activeClass : ''}`}
        onClick={(e) => this.onClick(e)}
      >
        <span className="nonhover">
          {t(this.state[this.key] ? this.actionDone : this.action)}{' '}
          {this.props.showName ? (
            <Name pub={this.props.id} userNameOnly={true} hideBadge={true} />
          ) : (
            ''
          )}
        </span>
        <span className="hover">{t(this.hoverAction)}</span>
      </Button>
    );
  }
}

export default BlockButton;
