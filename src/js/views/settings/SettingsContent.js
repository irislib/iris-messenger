import Component from '../../BaseComponent';

import AccountSettings from './AccountSettings';
import AppearanceSettings from './AppearanceSettings';
import BetaSettings from './BetaSettings';
import BlockedSettings from './BlockedSettings';
import LanguageSettings from './LanguageSettings';
import NostrSettings from './NostrSettings';
import WebRTCSettings from './WebRTCSettings';
import WebtorrentSettings from './WebtorrentSettings';

export default class SettingsContent extends Component {
  content = '';
  pages = {
    account: AccountSettings,
    nostr: NostrSettings,
    appearance: AppearanceSettings,
    language: LanguageSettings,
    webtorrent: WebtorrentSettings,
    webrtc: WebRTCSettings,
    beta: BetaSettings,
    blocked_users: BlockedSettings,
  };

  constructor() {
    super();
    this.content = 'home';
  }
  render() {
    const Content = this.pages[this.props.id] || this.pages.account;
    return <Content />;
  }
}
