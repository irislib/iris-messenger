import Nostr from '../Nostr';

import BlockButton from './BlockButton';

class FlagButton extends BlockButton {
  constructor() {
    super();
    this.cls = 'block';
    this.key = 'flagged';
    this.actionDone = 'flagged';
    this.action = 'flag (public)';
    this.activeClass = 'blocked';
    this.hoverAction = 'unflag';
  }

  onClick(e) {
    e.preventDefault();
    const newValue = !this.state[this.key];
    if (confirm(newValue ? 'Publicly flag this user?' : 'Unflag user?')) {
      Nostr.flag(Nostr.toNostrHexAddress(this.props.id), newValue);
    }
  }

  componentDidMount() {
    Nostr.getFlaggedUsers((flags) => {
      const flagged = flags?.has(Nostr.toNostrHexAddress(this.props.id));
      this.setState({ flagged });
    });
  }
}

export default FlagButton;
