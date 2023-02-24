import Nostr from '../nostr/Nostr';
import { translate as t } from '../translations/Translation';

import BlockButton from './BlockButton';

class ReportButton extends BlockButton {
  constructor() {
    super();
    this.cls = 'block';
    this.key = 'reported';
    this.activeClass = 'blocked';
    this.action = t('report_public');
    this.actionDone = t('reported');
    this.hoverAction = t('unreport');
  }

  onClick(e) {
    e.preventDefault();
    const newValue = !this.state[this.key];
    if (confirm(newValue ? 'Publicly report this user?' : 'Unreport user?')) {
      Nostr.flag(Nostr.toNostrHexAddress(this.props.id), newValue);
    }
  }

  componentDidMount() {
    Nostr.getFlaggedUsers((flags) => {
      const reported = flags?.has(Nostr.toNostrHexAddress(this.props.id));
      this.setState({ reported });
    });
  }
}

export default ReportButton;
