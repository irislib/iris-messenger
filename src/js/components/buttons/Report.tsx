import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';

import Block from './Block';

class Report extends Block {
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
      const hex = Key.toNostrHexAddress(this.props.id);
      hex && SocialNetwork.flag(hex, newValue);
    }
  }

  componentDidMount() {
    SocialNetwork.getFlaggedUsers((flags) => {
      const hex = Key.toNostrHexAddress(this.props.id);
      const reported = hex && flags?.has(hex);
      this.setState({ reported });
    });
  }
}

export default Report;
