import Component from '../BaseComponent';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import Button from './basic/Button';

type Props = {
  id: string;
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
    this.actionDone = 'blocked';
    this.action = 'block';
    this.activeClass = 'blocked';
    this.hoverAction = 'unblock';
  }

  onClick(e) {
    e.preventDefault();
    const newValue = !this.state[this.key];
    Nostr.block(Nostr.toNostrHexAddress(this.props.id), newValue);
  }

  componentDidMount() {
    Nostr.getBlockedUsers((blocks) => {
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
        <span className="nonhover">{t(this.state[this.key] ? this.actionDone : this.action)}</span>
        <span className="hover">{t(this.hoverAction)}</span>
      </Button>
    );
  }
}

export default BlockButton;
