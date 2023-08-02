import Component from '../../BaseComponent';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';
import Name from '../user/Name';

type Props = {
  id: string;
  showName?: boolean;
  className?: string;
  onClick?: (e) => void;
};

class Block extends Component<Props> {
  key: string;
  cls?: string;
  actionDone: string;
  action: string;
  activeClass: string;
  hoverAction: string;

  constructor() {
    super();
    this.cls = 'block-btn';
    this.key = 'blocked';
    this.activeClass = 'blocked';
    this.action = t('block');
    this.actionDone = t('blocked');
    this.hoverAction = t('unblock');
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
    hex && SocialNetwork.block(hex, newValue);
    this.props.onClick?.(e);
  }

  componentDidMount() {
    SocialNetwork.getBlockedUsers((blocks) => {
      const blocked = blocks?.has(Key.toNostrHexAddress(this.props.id) as string);
      this.setState({ blocked });
    });
  }

  render() {
    const isBlocked = this.state[this.key];
    const isHovering = this.state.hover;

    let buttonText;

    if (isBlocked && isHovering) {
      buttonText = this.hoverAction;
    } else if (isBlocked && !isHovering) {
      buttonText = this.actionDone;
    } else {
      buttonText = this.action;
    }

    return (
      <button
        className={`${this.cls || this.key} ${isBlocked ? this.activeClass : ''} ${
          this.props.className || ''
        }`}
        onClick={(e) => this.onClick(e)}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <span>
          {t(buttonText)} {this.props.showName ? <Name pub={this.props.id} hideBadge={true} /> : ''}
        </span>
      </button>
    );
  }
}

export default Block;
