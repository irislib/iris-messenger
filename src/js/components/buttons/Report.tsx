import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation';

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
      SocialNetwork.flag(Key.toNostrHexAddress(this.props.id), newValue);
    }
  }

  componentDidMount() {
    SocialNetwork.getFlaggedUsers((flags) => {
      const reported = flags?.has(Key.toNostrHexAddress(this.props.id));
      this.setState({ reported });
    });
  }
}

export default Report;
